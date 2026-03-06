using TaskManagement.Domain.Enums;
using TaskStatus = TaskManagement.Domain.Enums.TaskStatus;

namespace TaskManagement.Domain.Entities;

/// <summary>
/// Represents a task on the Kanban board.
/// Named "TaskItem" to avoid collision with System.Threading.Tasks.Task.
/// </summary>
public class TaskItem
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskStatus Status { get; set; } = TaskStatus.Todo;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public DateTime? Deadline { get; set; }

    /// <summary>
    /// The user this task is assigned to. Nullable — tasks can be unassigned.
    /// </summary>
    public Guid? AssigneeId { get; set; }

    /// <summary>
    /// The team this task belongs to. Enforces team isolation.
    /// </summary>
    public Guid TeamId { get; set; }

    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? Assignee { get; set; }
    public Team Team { get; set; } = null!;
    public User Creator { get; set; } = null!;
}
