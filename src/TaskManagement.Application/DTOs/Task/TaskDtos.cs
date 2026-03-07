using TaskManagement.Domain.Enums;
using TaskStatus = TaskManagement.Domain.Enums.TaskStatus;

namespace TaskManagement.Application.DTOs.Task;

/// <summary>
/// Request DTO for creating a new task.
/// </summary>
public class CreateTaskDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public DateTime? Deadline { get; set; }
    public Guid? AssigneeId { get; set; }
    public Guid TeamId { get; set; }
}

/// <summary>
/// Response DTO for task data.
/// </summary>
public class TaskResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskStatus Status { get; set; }
    public TaskPriority Priority { get; set; }
    public DateTime? Deadline { get; set; }
    public string? AssigneeName { get; set; }
    public Guid? AssigneeId { get; set; }
    public Guid TeamId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public IReadOnlyCollection<TaskAttachmentDto> Attachments { get; set; } = Array.Empty<TaskAttachmentDto>();
}

/// <summary>
/// Request DTO for updating a task's status.
/// </summary>
public class UpdateTaskStatusDto
{
    public TaskStatus Status { get; set; }
}

/// <summary>
/// Request DTO for assigning a task to a user.
/// </summary>
public class AssignTaskDto
{
    public Guid AssigneeId { get; set; }
}

/// <summary>
/// Request DTO for partial task updates.
/// </summary>
public class UpdateTaskDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public TaskStatus? Status { get; set; }
    public TaskPriority? Priority { get; set; }
    public DateTime? Deadline { get; set; }
    public bool ClearDeadline { get; set; }
    public Guid? AssigneeId { get; set; }
    public bool ClearAssignee { get; set; }
}

public class UploadTaskAttachmentDto
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public byte[] Content { get; set; } = Array.Empty<byte>();
}

public class TaskAttachmentDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string Url { get; set; } = string.Empty;
    public string UploadedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
