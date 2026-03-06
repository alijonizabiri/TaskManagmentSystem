using TaskManagement.Domain.Enums;

namespace TaskManagement.Domain.Entities;

/// <summary>
/// Represents an invitation for a user to join a team.
/// Invitations are sent by Admins or TeamLeads and expire after a set time.
/// </summary>
public class TeamInvite
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public string Email { get; set; } = string.Empty;
    public Role Role { get; set; }

    /// <summary>
    /// Unique token used to accept the invitation via a link.
    /// </summary>
    public string Token { get; set; } = string.Empty;

    public InviteStatus Status { get; set; } = InviteStatus.Pending;
    public DateTime ExpireAt { get; set; }

    // Navigation properties
    public Team Team { get; set; } = null!;
}
