using TaskManagement.Application.DTOs.Admin;
using TaskManagement.Application.DTOs.Task;
using TaskManagement.Application.DTOs.Team;
using TaskManagement.Application.Interfaces;
using TaskManagement.Domain.Entities;
using TaskManagement.Domain.Enums;
using TaskManagement.Domain.Interfaces;
using TaskStatus = TaskManagement.Domain.Enums.TaskStatus;

namespace TaskManagement.Application.Services;

public class AdminService : IAdminService
{
    private readonly IUnitOfWork _unitOfWork;

    public AdminService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<AdminDashboardDto> GetDashboardAsync(Guid actorUserId)
    {
        await EnsureAdminAsync(actorUserId);

        var users = await _unitOfWork.Users.GetAllAsync();
        var teams = await _unitOfWork.Teams.GetAllAsync();
        var tasks = (await _unitOfWork.TaskItems.GetAllAsync()).ToList();

        var totalTasks = tasks.Count;
        var completedTasks = tasks.Count(t => t.Status == TaskStatus.Done);
        var overdueTasks = tasks.Count(t => t.Deadline.HasValue && t.Deadline.Value < DateTime.UtcNow && t.Status != TaskStatus.Done);

        return new AdminDashboardDto
        {
            TotalUsers = users.Count(),
            TotalTeams = teams.Count(),
            TotalTasks = totalTasks,
            CompletedTasksPercentage = CalculatePercentage(completedTasks, totalTasks),
            OverdueTasksPercentage = CalculatePercentage(overdueTasks, totalTasks)
        };
    }

    public async Task<IEnumerable<TeamPerformanceDto>> GetTeamPerformanceAsync(Guid actorUserId)
    {
        await EnsureAdminAsync(actorUserId);

        var teams = (await _unitOfWork.Teams.GetAllAsync()).ToList();
        var tasks = (await _unitOfWork.TaskItems.GetAllAsync()).ToList();

        var rows = teams
            .Select(team =>
            {
                var teamTasks = tasks.Where(t => t.TeamId == team.Id).ToList();
                var completedTasks = teamTasks.Count(t => t.Status == TaskStatus.Done);

                return new TeamPerformanceDto
                {
                    TeamId = team.Id,
                    TeamName = team.Name,
                    TotalTasks = teamTasks.Count,
                    CompletedTasks = completedTasks,
                    CompletionPercentage = CalculatePercentage(completedTasks, teamTasks.Count)
                };
            })
            .OrderByDescending(t => t.CompletionPercentage)
            .ThenByDescending(t => t.CompletedTasks)
            .ThenBy(t => t.TeamName)
            .ToList();

        var topTeam = rows.FirstOrDefault();
        if (topTeam is not null)
            topTeam.IsTopPerformer = true;

        return rows;
    }

    public async Task<IEnumerable<UserPerformanceDto>> GetUserPerformanceAsync(Guid actorUserId)
    {
        await EnsureAdminAsync(actorUserId);

        var completedTasks = (await _unitOfWork.TaskItems
            .FindAsync(t => t.Status == TaskStatus.Done && t.AssigneeId.HasValue))
            .ToList();

        var grouped = completedTasks
            .GroupBy(t => t.AssigneeId!.Value)
            .Select(g => new { UserId = g.Key, CompletedTasks = g.Count() })
            .OrderByDescending(g => g.CompletedTasks)
            .ToList();

        var result = new List<UserPerformanceDto>();
        foreach (var row in grouped)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(row.UserId);
            if (user is null)
                continue;

            result.Add(new UserPerformanceDto
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                CompletedTasks = row.CompletedTasks
            });
        }

        return result;
    }

    public async Task<IEnumerable<UserSummaryDto>> GetUsersAsync(Guid actorUserId, bool? isApproved = null)
    {
        await EnsureAdminAsync(actorUserId);

        IEnumerable<User> users;
        if (isApproved.HasValue)
        {
            users = await _unitOfWork.Users.FindAsync(u => u.IsApproved == isApproved.Value);
        }
        else
        {
            users = await _unitOfWork.Users.GetAllAsync();
        }

        return users
            .OrderByDescending(u => u.CreatedAt)
            .Select(MapToUserSummaryDto)
            .ToList();
    }

    public async Task<IEnumerable<PendingUserDto>> GetPendingUsersAsync(Guid actorUserId)
    {
        await EnsureAdminAsync(actorUserId);

        var pendingUsers = await _unitOfWork.Users.FindAsync(u => !u.IsApproved);
        return pendingUsers
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new PendingUserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                CreatedAt = u.CreatedAt
            })
            .ToList();
    }

    public async Task<MessageResult> ApproveUserAsync(Guid actorUserId, Guid userId)
    {
        await EnsureAdminAsync(actorUserId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user is null)
            return MessageResult.Fail("User not found.");

        if (user.IsApproved)
            return MessageResult.Fail("User is already approved.");

        user.IsApproved = true;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return MessageResult.Ok($"User '{user.FullName}' has been approved.");
    }

    public async Task<MessageResult> RejectUserAsync(Guid actorUserId, Guid userId)
    {
        await EnsureAdminAsync(actorUserId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user is null)
            return MessageResult.Fail("User not found.");

        if (user.IsApproved)
            return MessageResult.Fail("Cannot reject an already approved user.");

        _unitOfWork.Users.Remove(user);
        await _unitOfWork.SaveChangesAsync();

        return MessageResult.Ok($"User '{user.FullName}' has been rejected and removed.");
    }

    public async Task<MessageResult> UpdateUserRoleAsync(Guid actorUserId, Guid userId, Role role)
    {
        var actor = await EnsureAdminAsync(actorUserId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user is null)
            return MessageResult.Fail("User not found.");

        if (actor.Id == user.Id && role != Role.Admin)
            return MessageResult.Fail("Admin cannot downgrade their own role.");

        if (user.Role == Role.Admin && role != Role.Admin)
        {
            var adminCount = (await _unitOfWork.Users.FindAsync(u => u.Role == Role.Admin && u.IsApproved)).Count();
            if (adminCount <= 1)
                return MessageResult.Fail("At least one approved Admin must remain in the system.");
        }

        user.Role = role;
        _unitOfWork.Users.Update(user);

        var memberships = (await _unitOfWork.TeamMembers.FindAsync(tm => tm.UserId == userId)).ToList();

        if (role == Role.Admin)
        {
            foreach (var membership in memberships)
            {
                _unitOfWork.TeamMembers.Remove(membership);
            }
        }
        else
        {
            var membershipRole = role == Role.TeamLead ? Role.TeamLead : Role.User;
            foreach (var membership in memberships)
            {
                membership.Role = membershipRole;
                _unitOfWork.TeamMembers.Update(membership);
            }
        }

        await _unitOfWork.SaveChangesAsync();

        return MessageResult.Ok($"User role updated to {role}.");
    }

    public async Task<IEnumerable<TeamResponseDto>> GetAllTeamsAsync(Guid actorUserId)
    {
        await EnsureAdminAsync(actorUserId);

        var teams = await _unitOfWork.Teams.GetAllAsync();
        var result = new List<TeamResponseDto>();

        foreach (var team in teams.OrderByDescending(t => t.CreatedAt))
        {
            var memberCount = (await _unitOfWork.TeamMembers.FindAsync(tm => tm.TeamId == team.Id)).Count();
            var tasks = (await _unitOfWork.TaskItems.FindAsync(t => t.TeamId == team.Id)).ToList();
            var completedTaskCount = tasks.Count(t => t.Status == TaskStatus.Done);

            result.Add(new TeamResponseDto
            {
                Id = team.Id,
                Name = team.Name,
                MemberCount = memberCount,
                TaskCount = tasks.Count,
                CompletedTaskCount = completedTaskCount,
                CompletionPercentage = CalculatePercentage(completedTaskCount, tasks.Count),
                CreatedAt = team.CreatedAt
            });
        }

        return result;
    }

    public async Task<IEnumerable<TaskResponseDto>> GetAllTasksAsync(Guid actorUserId)
    {
        await EnsureAdminAsync(actorUserId);

        var tasks = await _unitOfWork.TaskItems.GetAllAsync();
        var result = new List<TaskResponseDto>();

        foreach (var task in tasks.OrderByDescending(t => t.CreatedAt))
        {
            var creator = await _unitOfWork.Users.GetByIdAsync(task.CreatedBy);

            string? assigneeName = null;
            if (task.AssigneeId.HasValue)
            {
                var assignee = await _unitOfWork.Users.GetByIdAsync(task.AssigneeId.Value);
                assigneeName = assignee?.FullName;
            }

            result.Add(new TaskResponseDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Status = task.Status,
                Priority = task.Priority,
                Deadline = task.Deadline,
                AssigneeName = assigneeName,
                AssigneeId = task.AssigneeId,
                TeamId = task.TeamId,
                CreatedByName = creator?.FullName ?? string.Empty,
                CreatedAt = task.CreatedAt
            });
        }

        return result;
    }

    public async Task<MessageResult> AddUserToTeamAsync(Guid actorUserId, Guid teamId, Guid userId)
    {
        await EnsureAdminAsync(actorUserId);

        var team = await _unitOfWork.Teams.GetByIdAsync(teamId);
        if (team is null)
            return MessageResult.Fail("Team not found.");

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user is null)
            return MessageResult.Fail("User not found.");

        if (!user.IsApproved)
            return MessageResult.Fail("User must be approved before team assignment.");

        if (user.Role == Role.Admin)
            return MessageResult.Fail("Admin does not belong to teams.");

        var exists = await _unitOfWork.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && tm.UserId == userId);

        if (exists)
            return MessageResult.Fail("User is already a member of this team.");

        await _unitOfWork.TeamMembers.AddAsync(new TeamMember
        {
            Id = Guid.NewGuid(),
            TeamId = teamId,
            UserId = userId,
            Role = user.Role == Role.TeamLead ? Role.TeamLead : Role.User
        });

        await _unitOfWork.SaveChangesAsync();
        return MessageResult.Ok("User assigned to team successfully.");
    }

    private async Task<User> EnsureAdminAsync(Guid actorUserId)
    {
        var actor = await _unitOfWork.Users.GetByIdAsync(actorUserId);
        if (actor is null || !actor.IsApproved)
            throw new UnauthorizedAccessException("Only approved admins can perform this action.");

        if (actor.Role != Role.Admin)
            throw new UnauthorizedAccessException("Only admins can perform this action.");

        return actor;
    }

    private static UserSummaryDto MapToUserSummaryDto(User user)
    {
        return new UserSummaryDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            IsApproved = user.IsApproved,
            LastSeenAt = user.LastSeenAt,
            CreatedAt = user.CreatedAt
        };
    }

    private static decimal CalculatePercentage(int numerator, int denominator)
    {
        if (denominator == 0)
            return 0m;

        return Math.Round((decimal)numerator * 100m / denominator, 2);
    }
}
