using TaskManagement.Application.DTOs.Team;

namespace TaskManagement.Application.Interfaces;

public interface ITeamService
{
    Task<TeamResponseDto> CreateTeamAsync(CreateTeamDto dto, Guid createdByUserId);
    Task<TeamResponseDto> UpdateTeamAsync(Guid teamId, UpdateTeamDto dto, Guid actorUserId);
    Task DeleteTeamAsync(Guid teamId, Guid actorUserId);
    Task<IEnumerable<TeamResponseDto>> GetUserTeamsAsync(Guid userId);
    Task<TeamDetailDto> GetTeamByIdAsync(Guid teamId, Guid requestingUserId);
    Task<TeamStatsDto> GetTeamStatsAsync(Guid teamId, Guid requestingUserId);
    Task<IEnumerable<TeamMemberDto>> GetTeamMembersAsync(Guid teamId, Guid requestingUserId);
    Task<TeamInviteResponseDto> InviteToTeamAsync(Guid teamId, CreateTeamInviteDto dto, Guid invitedByUserId);
}
