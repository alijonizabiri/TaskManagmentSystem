using TaskManagement.Domain.Enums;

namespace TaskManagement.Application.DTOs.Team;

/// <summary>
/// Request DTO for creating a new team.
/// </summary>
public class CreateTeamDto
{
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// Response DTO for team data.
/// </summary>
public class TeamResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Response DTO for a team member listing.
/// </summary>
public class TeamMemberDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Role Role { get; set; }
}

/// <summary>
/// Request DTO for inviting a user to a team.
/// </summary>
public class CreateTeamInviteDto
{
    public string Email { get; set; } = string.Empty;
    public Role Role { get; set; }
}

/// <summary>
/// Response DTO for a team invitation.
/// </summary>
public class TeamInviteResponseDto
{
    public string Message { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
}
