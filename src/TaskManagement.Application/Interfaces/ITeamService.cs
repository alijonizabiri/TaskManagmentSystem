using TaskManagement.Application.DTOs.Team;

namespace TaskManagement.Application.Interfaces;

public interface ITeamService
{
    Task<TeamResponseDto> CreateTeamAsync(CreateTeamDto dto, Guid createdByUserId);
    Task<IEnumerable<TeamResponseDto>> GetUserTeamsAsync(Guid userId);
    Task<IEnumerable<TeamMemberDto>> GetTeamMembersAsync(Guid teamId, Guid requestingUserId);
    Task<TeamInviteResponseDto> InviteToTeamAsync(Guid teamId, CreateTeamInviteDto dto, Guid invitedByUserId);
}
