using TaskManagement.Domain.Enums;

namespace TaskManagement.Application.DTOs.Team;

/// <summary>
/// Request DTO for creating a new team.
/// </summary>
public class CreateTeamDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? TeamLeadId { get; set; }
}

public class UpdateTeamDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? TeamLeadId { get; set; }
}

/// <summary>
/// Response DTO for team data.
/// </summary>
public class TeamResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int MemberCount { get; set; }
    public int TaskCount { get; set; }
    public int CompletedTaskCount { get; set; }
    public decimal CompletionPercentage { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TeamDetailDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int MemberCount { get; set; }
    public int TaskCount { get; set; }
    public int CompletedTaskCount { get; set; }
    public decimal CompletionPercentage { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TeamStatsDto
{
    public Guid TeamId { get; set; }
    public int Backlog { get; set; }
    public int Todo { get; set; }
    public int InProgress { get; set; }
    public int Done { get; set; }
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
