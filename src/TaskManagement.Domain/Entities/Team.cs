namespace TaskManagement.Domain.Entities;

/// <summary>
/// Represents a team within the workspace.
/// Teams are created by Admins and serve as the isolation boundary for tasks.
/// </summary>
public class Team
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Creator { get; set; } = null!;
    public ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<TeamInvite> Invites { get; set; } = new List<TeamInvite>();
}
