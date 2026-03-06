namespace TaskManagement.Domain.Enums;

/// <summary>
/// Represents the status of a team invitation.
/// </summary>
public enum InviteStatus
{
    Pending = 0,
    Accepted = 1,
    Rejected = 2,
    Expired = 3
}
