using TaskManagement.Domain.Enums;

namespace TaskManagement.Domain.Entities;

/// <summary>
/// Represents a registered user in the system.
/// Users must be approved by an Admin before they can log in.
/// </summary>
public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// Global system role. Admin has full visibility and is not team-scoped.
    /// </summary>
    public Role Role { get; set; } = Role.User;

    /// <summary>
    /// Indicates whether an Admin has approved this user.
    /// Unapproved users cannot log in.
    /// </summary>
    public bool IsApproved { get; set; }

    public DateTime? LastSeenAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<TeamMember> TeamMemberships { get; set; } = new List<TeamMember>();
    public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
    public ICollection<TaskItem> CreatedTasks { get; set; } = new List<TaskItem>();
    public ICollection<Team> CreatedTeams { get; set; } = new List<Team>();
}
