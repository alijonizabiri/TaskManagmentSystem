using TaskManagement.Domain.Enums;

namespace TaskManagement.Domain.Entities;

/// <summary>
/// Join entity between User and Team.
/// Role is a team-scoped metadata field and does not replace User.Role for global authorization.
/// </summary>
public class TeamMember
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public Guid UserId { get; set; }
    public Role Role { get; set; } = Role.User;

    // Navigation properties
    public Team Team { get; set; } = null!;
    public User User { get; set; } = null!;
}