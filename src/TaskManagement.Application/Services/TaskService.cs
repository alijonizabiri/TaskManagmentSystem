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
    private readonly IUnitOfWork _unitOfWork;

    public TaskService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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
            var assignee = await _unitOfWork.Users.GetByIdAsync(dto.AssigneeId.Value);
            if (assignee is null || !assignee.IsApproved)
                throw new InvalidOperationException("Assignee not found or not approved.");

            if (assignee.Role == Role.Admin)
                throw new InvalidOperationException("Admin cannot be assigned to team tasks.");

            var assigneeIsMember = await IsTeamMemberAsync(dto.TeamId, dto.AssigneeId.Value);
            if (!assigneeIsMember)
                throw new InvalidOperationException("The assignee is not a member of this team.");
        }

        var taskItem = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            Status = TaskStatus.Todo,
            Priority = dto.Priority,
            Deadline = dto.Deadline,
            AssigneeId = dto.AssigneeId,
            TeamId = dto.TeamId,
            CreatedBy = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.TaskItems.AddAsync(taskItem);
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
            if (teamId.HasValue)
            {
                tasks = await _unitOfWork.TaskItems.FindAsync(t => t.TeamId == teamId.Value);
            }
            else
            {
                tasks = await _unitOfWork.TaskItems.GetAllAsync();
            }
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

        if (actor.Role != Role.Admin)
        {
            var isMember = await IsTeamMemberAsync(task.TeamId, requestingUserId);
            if (!isMember)
                throw new UnauthorizedAccessException("You are not a member of this team.");
        }

        var creator = await _unitOfWork.Users.GetByIdAsync(task.CreatedBy);
        string? assigneeName = null;
        if (task.AssigneeId.HasValue)
        {
            var assignee = await _unitOfWork.Users.GetByIdAsync(task.AssigneeId.Value);
            assigneeName = assignee?.FullName;
        }

        return MapToDto(task, creator?.FullName ?? string.Empty, assigneeName);
    }

    /// <summary>
    /// Admin can update any task status. TeamLead/User can update status only in their teams.
    /// </summary>
    public async Task<MessageResult> UpdateTaskStatusAsync(Guid taskId, UpdateTaskStatusDto dto, Guid requestingUserId)
    {
        var actor = await GetApprovedActorAsync(requestingUserId);

        var task = await _unitOfWork.TaskItems.GetByIdAsync(taskId);
        if (task is null)
            return MessageResult.Fail("Task not found.");

        if (actor.Role != Role.Admin)
        {
            var isMember = await IsTeamMemberAsync(task.TeamId, requestingUserId);
            if (!isMember)
                return MessageResult.Fail("You are not a member of this team.");
        }

        task.Status = dto.Status;
        _unitOfWork.TaskItems.Update(task);
        await _unitOfWork.SaveChangesAsync();

        return MessageResult.Ok($"Task status updated to '{dto.Status}'.");
    }

    /// <summary>
    /// Admin can assign any task. TeamLead can assign only within teams they belong to.
    /// </summary>
    public async Task<MessageResult> AssignTaskAsync(Guid taskId, AssignTaskDto dto, Guid requestingUserId)
    {
        var actor = await GetApprovedActorAsync(requestingUserId);

        var task = await _unitOfWork.TaskItems.GetByIdAsync(taskId);
        if (task is null)
            return MessageResult.Fail("Task not found.");

        if (actor.Role == Role.User)
            return MessageResult.Fail("Only Admins and TeamLeads can assign tasks.");

        if (actor.Role == Role.TeamLead)
        {
            var canManageTeam = await IsTeamMemberAsync(task.TeamId, requestingUserId);
            if (!canManageTeam)
                return MessageResult.Fail("TeamLead can only assign tasks in teams they belong to.");
        }

        var assignee = await _unitOfWork.Users.GetByIdAsync(dto.AssigneeId);
        if (assignee is null || !assignee.IsApproved)
            return MessageResult.Fail("Assignee not found or not approved.");

        if (assignee.Role == Role.Admin)
            return MessageResult.Fail("Admin cannot be assigned to team tasks.");

        var assigneeIsMember = await IsTeamMemberAsync(task.TeamId, dto.AssigneeId);
        if (!assigneeIsMember)
            return MessageResult.Fail("The assignee is not a member of this team.");

        task.AssigneeId = dto.AssigneeId;
        _unitOfWork.TaskItems.Update(task);
        await _unitOfWork.SaveChangesAsync();

        return MessageResult.Ok("Task assigned successfully.");
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

    private static TaskResponseDto MapToDto(TaskItem task, string creatorName, string? assigneeName)
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
            CreatedAt = task.CreatedAt
        };
    }
}