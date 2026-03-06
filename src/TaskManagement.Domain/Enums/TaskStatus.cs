namespace TaskManagement.Domain.Enums;

/// <summary>
/// Represents the current status of a task on the Kanban board.
/// </summary>
public enum TaskStatus
{
    Todo = 0,
    InProgress = 1,
    Review = 2,
    Done = 3
}
