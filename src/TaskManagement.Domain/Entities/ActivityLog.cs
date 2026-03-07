namespace TaskManagement.Domain.Entities;

/// <summary>
/// Immutable audit record for create/update/delete actions.
/// </summary>
public class ActivityLog
{
    public Guid Id { get; set; }
    public Guid ActorUserId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Actor { get; set; } = null!;
}
