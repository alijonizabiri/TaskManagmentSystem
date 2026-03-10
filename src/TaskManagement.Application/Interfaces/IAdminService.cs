using TaskManagement.Application.DTOs.Admin;
using TaskManagement.Application.DTOs.Common;
using TaskManagement.Application.DTOs.Task;
using TaskManagement.Application.DTOs.Team;
using TaskManagement.Domain.Enums;

namespace TaskManagement.Application.Interfaces;

public interface IAdminService
{
    Task<AdminDashboardDto> GetDashboardAsync(Guid actorUserId);
    Task<IEnumerable<TeamPerformanceDto>> GetTeamPerformanceAsync(Guid actorUserId);
    Task<IEnumerable<UserPerformanceDto>> GetUserPerformanceAsync(Guid actorUserId);
    Task<IEnumerable<UserSummaryDto>> GetUsersAsync(Guid actorUserId, bool? isApproved = null);
    Task<IEnumerable<PendingUserDto>> GetPendingUsersAsync(Guid actorUserId);
    Task<MessageResult> ApproveUserAsync(Guid actorUserId, Guid userId);
    Task<MessageResult> RejectUserAsync(Guid actorUserId, Guid userId);
    Task<MessageResult> UpdateUserRoleAsync(Guid actorUserId, Guid userId, Role role);
    Task<MessageResult> UpdateTelegramUsernameAsync(Guid actorUserId, Guid userId, string? telegramUsername);
    Task<IEnumerable<TeamResponseDto>> GetAllTeamsAsync(Guid actorUserId);
    Task<IEnumerable<TaskResponseDto>> GetAllTasksAsync(Guid actorUserId);
    Task<MessageResult> AddUserToTeamAsync(Guid actorUserId, Guid teamId, Guid userId);
    Task<PagedResultDto<ActivityLogDto>> GetActivityLogsAsync(Guid actorUserId, ActivityLogQueryDto query);
}
