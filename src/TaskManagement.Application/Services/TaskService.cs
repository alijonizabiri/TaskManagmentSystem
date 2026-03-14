using TaskManagement.Application.DTOs.Task;
using TaskManagement.Application.Interfaces;
using TaskManagement.Domain.Entities;
using TaskManagement.Domain.Enums;
using TaskManagement.Domain.Interfaces;
using TaskStatus = TaskManagement.Domain.Enums.TaskStatus;

namespace TaskManagement.Application.Services;

/// <summary>
/// Task management with global role checks and team isolation.
/// </summary>
public class TaskService : ITaskService
{
    private const int MaxAttachmentSizeBytes = 10 * 1024 * 1024;

    private readonly IUnitOfWork _unitOfWork;
    private readonly ITaskAttachmentStorage _taskAttachmentStorage;

    public TaskService(IUnitOfWork unitOfWork, ITaskAttachmentStorage taskAttachmentStorage)
    {
        _unitOfWork = unitOfWork;
        _taskAttachmentStorage = taskAttachmentStorage;
    }

    /// <summary>
    /// Admin and TeamLead can create tasks.
    /// TeamLead is restricted to teams they belong to.
    /// </summary>
    public async Task<TaskResponseDto> CreateTaskAsync(CreateTaskDto dto, Guid createdByUserId)
    {
        var actor = await GetApprovedActorAsync(createdByUserId);

        if (actor.Role == Role.User)
            throw new UnauthorizedAccessException("Only Admins and TeamLeads can create tasks.");

        var team = await _unitOfWork.Teams.GetByIdAsync(dto.TeamId);
        if (team is null)
            throw new KeyNotFoundException("Team not found.");

        if (actor.Role == Role.TeamLead)
        {
            var isTeamMember = await IsTeamMemberAsync(dto.TeamId, createdByUserId);
            if (!isTeamMember)
                throw new UnauthorizedAccessException("TeamLead can only create tasks in teams they belong to.");
        }

        if (dto.AssigneeId.HasValue)
        {
            var assigneeValidation = await ValidateAssigneeForTeamAsync(dto.TeamId, dto.AssigneeId.Value);
            if (!assigneeValidation.Success)
                throw new InvalidOperationException(assigneeValidation.Message);
        }

        var taskItem = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = NormalizeDescription(dto.Description),
            Status = TaskStatus.Todo,
            Priority = dto.Priority,
            Deadline = dto.Deadline,
            AssigneeId = dto.AssigneeId,
            TeamId = dto.TeamId,
            CreatedBy = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.TaskItems.AddAsync(taskItem);
        await AddAdminLogIfNeededAsync(actor, "Create", "Task", taskItem.Id, $"Created task '{taskItem.Title}'.");
        await _unitOfWork.SaveChangesAsync();

        string? assigneeName = null;
        if (dto.AssigneeId.HasValue)
        {
            var assignee = await _unitOfWork.Users.GetByIdAsync(dto.AssigneeId.Value);
            assigneeName = assignee?.FullName;
        }

        return MapToDto(taskItem, actor.FullName, assigneeName);
    }

    /// <summary>
    /// Admin can read all tasks. TeamLead/User can read only tasks in their teams.
    /// </summary>
    public async Task<IEnumerable<TaskResponseDto>> GetTasksAsync(Guid requestingUserId, Guid? teamId = null)
    {
        var actor = await GetApprovedActorAsync(requestingUserId);

        IEnumerable<TaskItem> tasks;

        if (actor.Role == Role.Admin)
        {
            tasks = teamId.HasValue
                ? await _unitOfWork.TaskItems.FindAsync(t => t.TeamId == teamId.Value)
                : await _unitOfWork.TaskItems.GetAllAsync();
        }
        else
        {
            var memberships = await _unitOfWork.TeamMembers.FindAsync(tm => tm.UserId == requestingUserId);
            var teamIds = memberships.Select(m => m.TeamId).Distinct().ToList();

            if (teamId.HasValue)
            {
                if (!teamIds.Contains(teamId.Value))
                    throw new UnauthorizedAccessException("You are not a member of this team.");

                teamIds = new List<Guid> { teamId.Value };
            }

            if (teamIds.Count == 0)
                return Enumerable.Empty<TaskResponseDto>();

            tasks = await _unitOfWork.TaskItems.FindAsync(t => teamIds.Contains(t.TeamId));
        }

        return await MapTaskListToDtosAsync(tasks.OrderByDescending(t => t.CreatedAt));
    }

    public async Task<IEnumerable<TaskResponseDto>> GetAssignedTasksAsync(Guid requestingUserId, Guid? teamId = null)
    {
        var tasks = await GetTasksAsync(requestingUserId, teamId);
        return tasks
            .Where(t => t.AssigneeId == requestingUserId)
            .OrderBy(t => t.Deadline ?? DateTime.MaxValue)
            .ThenByDescending(t => t.CreatedAt)
            .ToList();
    }

    /// <summary>
    /// Returns activity feed for a team with optional creator filter.
    /// </summary>
    public async Task<IEnumerable<TaskResponseDto>> GetActivitiesAsync(
        Guid requestingUserId,
        Guid teamId,
        Guid? createdByUserId = null)
    {
        var actor = await GetApprovedActorAsync(requestingUserId);

        if (actor.Role != Role.Admin)
        {
            var isMember = await IsTeamMemberAsync(teamId, requestingUserId);
            if (!isMember)
                throw new UnauthorizedAccessException("You are not a member of this team.");
        }

        IEnumerable<TaskItem> tasks;
        if (createdByUserId.HasValue)
        {
            tasks = await _unitOfWork.TaskItems
                .FindAsync(t => t.TeamId == teamId && t.CreatedBy == createdByUserId.Value);
        }
        else
        {
            tasks = await _unitOfWork.TaskItems
                .FindAsync(t => t.TeamId == teamId);
        }

        return await MapTaskListToDtosAsync(tasks.OrderByDescending(t => t.CreatedAt));
    }

    /// <summary>
    /// Returns task details when actor has access.
    /// </summary>
    public async Task<TaskResponseDto> GetTaskByIdAsync(Guid taskId, Guid requestingUserId)
    {
        var actor = await GetApprovedActorAsync(requestingUserId);

        var task = await _unitOfWork.TaskItems.GetByIdAsync(taskId);
        if (task is null)
            throw new KeyNotFoundException("Task not found.");

        var canAccess = await CanAccessTaskAsync(actor, task);
        if (!canAccess)
            throw new UnauthorizedAccessException("You are not a member of this team.");

        var creator = await _unitOfWork.Users.GetByIdAsync(task.CreatedBy);

        string? assigneeName = null;
        if (task.AssigneeId.HasValue)
        {
            var assignee = await _unitOfWork.Users.GetByIdAsync(task.AssigneeId.Value);
            assigneeName = assignee?.FullName;
        }

        var attachments = await BuildAttachmentDtosAsync(task.Id);
        return MapToDto(task, creator?.FullName ?? string.Empty, assigneeName, attachments);
    }

    public async Task<MessageResult> UpdateTaskAsync(Guid taskId, UpdateTaskDto dto, Guid requestingUserId)
    {
        if (!HasAnyUpdateField(dto))
            return MessageResult.Fail("No changes were provided.");

        var actor = await GetApprovedActorAsync(requestingUserId);

        var task = await _unitOfWork.TaskItems.GetByIdAsync(taskId);
        if (task is null)
            return MessageResult.Fail("Task not found.");

        var canAccess = await CanAccessTaskAsync(actor, task);
        if (!canAccess)
            return MessageResult.Fail("You are not a member of this team.");

        var canManageTaskDetails = actor.Role is Role.Admin or Role.TeamLead;

        if (!canManageTaskDetails && RequiresManagePermission(dto))
            return MessageResult.Fail("Only Admins and TeamLeads can edit this task field.");

        if (dto.Title is not null)
        {
            var title = dto.Title.Trim();
            if (string.IsNullOrWhiteSpace(title))
                return MessageResult.Fail("Task title cannot be empty.");

            task.Title = title;
        }

        if (dto.Description is not null)
        {
            task.Description = NormalizeDescription(dto.Description);
        }

        if (dto.Status.HasValue)
        {
            task.Status = dto.Status.Value;
        }

        if (dto.Priority.HasValue)
        {
            task.Priority = dto.Priority.Value;
        }

        if (dto.ClearDeadline)
        {
            task.Deadline = null;
        }
        else if (dto.Deadline.HasValue)
        {
            task.Deadline = dto.Deadline.Value;
        }

        if (dto.ClearAssignee)
        {
            task.AssigneeId = null;
        }
        else if (dto.AssigneeId.HasValue)
        {
            var assigneeValidation = await ValidateAssigneeForTeamAsync(task.TeamId, dto.AssigneeId.Value);
            if (!assigneeValidation.Success)
                return MessageResult.Fail(assigneeValidation.Message);

            task.AssigneeId = dto.AssigneeId;
        }

        _unitOfWork.TaskItems.Update(task);
        await AddAdminLogIfNeededAsync(actor, "Update", "Task", task.Id, $"Updated task '{task.Title}'.");
        await _unitOfWork.SaveChangesAsync();

        return MessageResult.Ok("Task updated successfully.");
    }

    /// <summary>
    /// Admin can update any task status. TeamLead/User can update status only in their teams.
    /// </summary>
    public async Task<MessageResult> UpdateTaskStatusAsync(Guid taskId, UpdateTaskStatusDto dto, Guid requestingUserId)
    {
        return await UpdateTaskAsync(taskId, new UpdateTaskDto { Status = dto.Status }, requestingUserId);
    }

    /// <summary>
    /// Admin can assign any task. TeamLead can assign only within teams they belong to.
    /// </summary>
    public async Task<MessageResult> AssignTaskAsync(Guid taskId, AssignTaskDto dto, Guid requestingUserId)
    {
        var actor = await GetApprovedActorAsync(requestingUserId);

        if (actor.Role == Role.User)
            return MessageResult.Fail("Only Admins and TeamLeads can assign tasks.");

        return await UpdateTaskAsync(taskId, new UpdateTaskDto { AssigneeId = dto.AssigneeId }, requestingUserId);
    }

    public async Task<IEnumerable<TaskAttachmentDto>> GetAttachmentsAsync(Guid taskId, Guid requestingUserId)
    {
        var actor = await GetApprovedActorAsync(requestingUserId);

        var task = await _unitOfWork.TaskItems.GetByIdAsync(taskId);
        if (task is null)
            throw new KeyNotFoundException("Task not found.");

        var canAccess = await CanAccessTaskAsync(actor, task);
        if (!canAccess)
            throw new UnauthorizedAccessException("You are not a member of this team.");

        return await BuildAttachmentDtosAsync(taskId);
    }

    public async Task<TaskAttachmentDto> UploadAttachmentAsync(Guid taskId, UploadTaskAttachmentDto dto, Guid requestingUserId)
    {
        var actor = await GetApprovedActorAsync(requestingUserId);

        var task = await _unitOfWork.TaskItems.GetByIdAsync(taskId);
        if (task is null)
            throw new KeyNotFoundException("Task not found.");

        var canAccess = await CanAccessTaskAsync(actor, task);
        if (!canAccess)
            throw new UnauthorizedAccessException("You are not a member of this team.");

        if (dto.Content.Length == 0)
            throw new InvalidOperationException("Attachment content is empty.");

        if (dto.Content.Length > MaxAttachmentSizeBytes)
            throw new InvalidOperationException("Attachment is too large. Max size is 10 MB.");

        var sanitizedFileName = string.IsNullOrWhiteSpace(dto.FileName)
            ? "attachment"
            : dto.FileName.Trim();

        var storedFile = await _taskAttachmentStorage.SaveAsync(taskId, sanitizedFileName, dto.Content);

        var attachment = new TaskAttachment
        {
            Id = Guid.NewGuid(),
            TaskItemId = taskId,
            FileName = sanitizedFileName,
            StoredFileName = storedFile.StoredFileName,
            RelativePath = NormalizeRelativePath(storedFile.RelativePath),
            ContentType = string.IsNullOrWhiteSpace(dto.ContentType) ? "application/octet-stream" : dto.ContentType,
            SizeBytes = dto.Content.Length,
            UploadedBy = actor.Id,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.TaskAttachments.AddAsync(attachment);
        await AddAdminLogIfNeededAsync(actor, "Create", "TaskAttachment", attachment.Id, $"Uploaded attachment '{attachment.FileName}' for task '{task.Title}'.");
        await _unitOfWork.SaveChangesAsync();

        return MapAttachmentToDto(attachment, actor.FullName);
    }

    public async Task<MessageResult> DeleteAttachmentAsync(Guid taskId, Guid attachmentId, Guid requestingUserId)
    {
        var actor = await GetApprovedActorAsync(requestingUserId);

        var task = await _unitOfWork.TaskItems.GetByIdAsync(taskId);
        if (task is null)
            return MessageResult.Fail("Task not found.");

        var canAccess = await CanAccessTaskAsync(actor, task);
        if (!canAccess)
            return MessageResult.Fail("You are not a member of this team.");

        var attachment = await _unitOfWork.TaskAttachments
            .FirstOrDefaultAsync(x => x.Id == attachmentId && x.TaskItemId == taskId);

        if (attachment is null)
            return MessageResult.Fail("Attachment not found.");

        if (actor.Role == Role.User && attachment.UploadedBy != actor.Id)
            return MessageResult.Fail("You can only delete attachments you uploaded.");

        _unitOfWork.TaskAttachments.Remove(attachment);
        await AddAdminLogIfNeededAsync(actor, "Delete", "TaskAttachment", attachment.Id, $"Deleted attachment '{attachment.FileName}' from task '{task.Title}'.");
        await _unitOfWork.SaveChangesAsync();

        await _taskAttachmentStorage.DeleteAsync(attachment.RelativePath);
        return MessageResult.Ok("Attachment deleted successfully.");
    }

    private async Task<User> GetApprovedActorAsync(Guid actorUserId)
    {
        var actor = await _unitOfWork.Users.GetByIdAsync(actorUserId);
        if (actor is null || !actor.IsApproved)
            throw new UnauthorizedAccessException("Only approved users can perform this action.");

        return actor;
    }

    private async Task<bool> IsTeamMemberAsync(Guid teamId, Guid userId)
    {
        return await _unitOfWork.TeamMembers.AnyAsync(tm => tm.TeamId == teamId && tm.UserId == userId);
    }

    private async Task<bool> CanAccessTaskAsync(User actor, TaskItem task)
    {
        if (actor.Role == Role.Admin)
            return true;

        return await IsTeamMemberAsync(task.TeamId, actor.Id);
    }

    private async Task<MessageResult> ValidateAssigneeForTeamAsync(Guid teamId, Guid assigneeId)
    {
        var assignee = await _unitOfWork.Users.GetByIdAsync(assigneeId);
        if (assignee is null || !assignee.IsApproved)
            return MessageResult.Fail("Assignee not found or not approved.");

        if (assignee.Role == Role.Admin)
            return MessageResult.Fail("Admin cannot be assigned to team tasks.");

        var assigneeIsMember = await IsTeamMemberAsync(teamId, assigneeId);
        if (!assigneeIsMember)
            return MessageResult.Fail("The assignee is not a member of this team.");

        return MessageResult.Ok("Assignee is valid.");
    }

    private async Task<IEnumerable<TaskResponseDto>> MapTaskListToDtosAsync(IEnumerable<TaskItem> tasks)
    {
        var result = new List<TaskResponseDto>();

        foreach (var task in tasks)
        {
            var creator = await _unitOfWork.Users.GetByIdAsync(task.CreatedBy);

            string? assigneeName = null;
            if (task.AssigneeId.HasValue)
            {
                var assignee = await _unitOfWork.Users.GetByIdAsync(task.AssigneeId.Value);
                assigneeName = assignee?.FullName;
            }

            result.Add(MapToDto(task, creator?.FullName ?? string.Empty, assigneeName));
        }

        return result;
    }

    private async Task<IReadOnlyCollection<TaskAttachmentDto>> BuildAttachmentDtosAsync(Guid taskId)
    {
        var attachments = (await _unitOfWork.TaskAttachments.FindAsync(a => a.TaskItemId == taskId))
            .OrderByDescending(a => a.CreatedAt)
            .ToList();

        if (attachments.Count == 0)
            return Array.Empty<TaskAttachmentDto>();

        var result = new List<TaskAttachmentDto>(attachments.Count);
        foreach (var attachment in attachments)
        {
            var uploader = await _unitOfWork.Users.GetByIdAsync(attachment.UploadedBy);
            result.Add(MapAttachmentToDto(attachment, uploader?.FullName ?? "Unknown"));
        }

        return result;
    }

    private static TaskResponseDto MapToDto(
        TaskItem task,
        string creatorName,
        string? assigneeName,
        IReadOnlyCollection<TaskAttachmentDto>? attachments = null)
    {
        return new TaskResponseDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Status = task.Status,
            Priority = task.Priority,
            Deadline = task.Deadline,
            AssigneeName = assigneeName,
            AssigneeId = task.AssigneeId,
            TeamId = task.TeamId,
            CreatedByName = creatorName,
            CreatedAt = task.CreatedAt,
            Attachments = attachments ?? Array.Empty<TaskAttachmentDto>()
        };
    }

    private static TaskAttachmentDto MapAttachmentToDto(TaskAttachment attachment, string uploaderName)
    {
        return new TaskAttachmentDto
        {
            Id = attachment.Id,
            FileName = attachment.FileName,
            ContentType = attachment.ContentType,
            SizeBytes = attachment.SizeBytes,
            Url = $"/{NormalizeRelativePath(attachment.RelativePath)}",
            UploadedByName = uploaderName,
            CreatedAt = attachment.CreatedAt
        };
    }

    private static bool HasAnyUpdateField(UpdateTaskDto dto)
    {
        return dto.Title is not null
               || dto.Description is not null
               || dto.Status.HasValue
               || dto.Priority.HasValue
               || dto.Deadline.HasValue
               || dto.ClearDeadline
               || dto.AssigneeId.HasValue
               || dto.ClearAssignee;
    }

    private static bool RequiresManagePermission(UpdateTaskDto dto)
    {
        return dto.Title is not null
               || dto.Description is not null
               || dto.Priority.HasValue
               || dto.Deadline.HasValue
               || dto.ClearDeadline
               || dto.AssigneeId.HasValue
               || dto.ClearAssignee;
    }

    private static string? NormalizeDescription(string? description)
    {
        if (description is null)
            return null;

        var normalized = description.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static string NormalizeRelativePath(string relativePath)
    {
        return relativePath.Replace('\\', '/').TrimStart('/');
    }

    private async Task AddAdminLogIfNeededAsync(User actor, string action, string entityName, Guid? entityId, string description)
    {
        if (actor.Role != Role.Admin)
            return;

        await _unitOfWork.ActivityLogs.AddAsync(new ActivityLog
        {
            Id = Guid.NewGuid(),
            ActorUserId = actor.Id,
            ActorName = actor.FullName,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Description = description,
            CreatedAt = DateTime.UtcNow
        });
    }
}
