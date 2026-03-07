using TaskManagement.Application.DTOs.Team;
using TaskManagement.Application.Interfaces;
using TaskManagement.Domain.Entities;
using TaskManagement.Domain.Enums;
using TaskManagement.Domain.Interfaces;
using TaskStatus = TaskManagement.Domain.Enums.TaskStatus;

namespace TaskManagement.Application.Services;

/// <summary>
/// Team management with global role checks and strict team isolation.
/// </summary>
public class TeamService : ITeamService
{
    private readonly IUnitOfWork _unitOfWork;

    public TeamService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<TeamResponseDto> CreateTeamAsync(CreateTeamDto dto, Guid createdByUserId)
    {
        var actor = await GetApprovedActorAsync(createdByUserId);

        if (actor.Role != Role.Admin && actor.Role != Role.TeamLead)
            throw new UnauthorizedAccessException("Only Admins and TeamLeads can create teams.");

        var normalizedName = dto.Name.Trim();
        var normalizedDescription = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();

        if (string.IsNullOrWhiteSpace(normalizedName))
            throw new InvalidOperationException("Team name is required.");

        var team = new Team
        {
            Id = Guid.NewGuid(),
            Name = normalizedName,
            Description = normalizedDescription,
            CreatedBy = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Teams.AddAsync(team);

        var assignedTeamLeadId = await ResolveTeamLeadIdAsync(dto.TeamLeadId, actor);
        await ApplyTeamLeadMembershipAsync(team.Id, assignedTeamLeadId);
        await AddAdminLogIfNeededAsync(actor, "Create", "Team", team.Id, $"Created team '{team.Name}'.");

        await _unitOfWork.SaveChangesAsync();

        return await BuildTeamResponseAsync(team);
    }

    public async Task<TeamResponseDto> UpdateTeamAsync(Guid teamId, UpdateTeamDto dto, Guid actorUserId)
    {
        var actor = await GetApprovedActorAsync(actorUserId);

        if (actor.Role != Role.Admin && actor.Role != Role.TeamLead)
            throw new UnauthorizedAccessException("Only Admins and TeamLeads can update teams.");

        var team = await _unitOfWork.Teams.GetByIdAsync(teamId);
        if (team is null)
            throw new KeyNotFoundException("Team not found.");

        if (actor.Role == Role.TeamLead)
        {
            await EnsureTeamAccessAsync(teamId, actor);
        }

        var normalizedName = dto.Name.Trim();
        var normalizedDescription = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();

        if (string.IsNullOrWhiteSpace(normalizedName))
            throw new InvalidOperationException("Team name is required.");

        team.Name = normalizedName;
        team.Description = normalizedDescription;
        _unitOfWork.Teams.Update(team);

        var assignedTeamLeadId = await ResolveTeamLeadIdAsync(dto.TeamLeadId, actor);
        await ApplyTeamLeadMembershipAsync(team.Id, assignedTeamLeadId);
        await AddAdminLogIfNeededAsync(actor, "Update", "Team", team.Id, $"Updated team '{team.Name}'.");

        await _unitOfWork.SaveChangesAsync();
        return await BuildTeamResponseAsync(team);
    }

    public async Task DeleteTeamAsync(Guid teamId, Guid actorUserId)
    {
        var actor = await GetApprovedActorAsync(actorUserId);

        if (actor.Role != Role.Admin && actor.Role != Role.TeamLead)
            throw new UnauthorizedAccessException("Only Admins and TeamLeads can delete teams.");

        var team = await _unitOfWork.Teams.GetByIdAsync(teamId);
        if (team is null)
            throw new KeyNotFoundException("Team not found.");

        if (actor.Role == Role.TeamLead)
        {
            await EnsureTeamAccessAsync(teamId, actor);
        }

        await AddAdminLogIfNeededAsync(actor, "Delete", "Team", team.Id, $"Deleted team '{team.Name}'.");
        _unitOfWork.Teams.Remove(team);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<TeamResponseDto>> GetUserTeamsAsync(Guid userId)
    {
        var actor = await GetApprovedActorAsync(userId);

        IEnumerable<Team> visibleTeams;

        if (actor.Role == Role.Admin)
        {
            visibleTeams = await _unitOfWork.Teams.GetAllAsync();
        }
        else
        {
            var memberships = await _unitOfWork.TeamMembers.FindAsync(tm => tm.UserId == userId);
            var teamIds = memberships.Select(m => m.TeamId).Distinct().ToList();

            var teams = new List<Team>();
            foreach (var teamId in teamIds)
            {
                var team = await _unitOfWork.Teams.GetByIdAsync(teamId);
                if (team is not null)
                    teams.Add(team);
            }

            visibleTeams = teams;
        }

        var result = new List<TeamResponseDto>();
        foreach (var team in visibleTeams.OrderBy(t => t.Name))
        {
            result.Add(await BuildTeamResponseAsync(team));
        }

        return result;
    }

    public async Task<TeamDetailDto> GetTeamByIdAsync(Guid teamId, Guid requestingUserId)
    {
        var actor = await GetApprovedActorAsync(requestingUserId);

        var team = await _unitOfWork.Teams.GetByIdAsync(teamId);
        if (team is null)
            throw new KeyNotFoundException("Team not found.");

        await EnsureTeamAccessAsync(teamId, actor);

        var memberCount = (await _unitOfWork.TeamMembers.FindAsync(tm => tm.TeamId == teamId)).Count();
        var tasks = (await _unitOfWork.TaskItems.FindAsync(t => t.TeamId == teamId)).ToList();
        var completedTaskCount = tasks.Count(t => t.Status == TaskStatus.Done);
        var (teamLeadUserId, teamLeadName) = await GetTeamLeadAsync(teamId);

        return new TeamDetailDto
        {
            Id = team.Id,
            Name = team.Name,
            Description = team.Description,
            TeamLeadUserId = teamLeadUserId,
            TeamLeadName = teamLeadName,
            MemberCount = memberCount,
            TaskCount = tasks.Count,
            CompletedTaskCount = completedTaskCount,
            CompletionPercentage = CalculatePercentage(completedTaskCount, tasks.Count),
            CreatedAt = team.CreatedAt
        };
    }

    public async Task<TeamStatsDto> GetTeamStatsAsync(Guid teamId, Guid requestingUserId)
    {
        var actor = await GetApprovedActorAsync(requestingUserId);

        var team = await _unitOfWork.Teams.GetByIdAsync(teamId);
        if (team is null)
            throw new KeyNotFoundException("Team not found.");

        await EnsureTeamAccessAsync(teamId, actor);

        var tasks = (await _unitOfWork.TaskItems.FindAsync(t => t.TeamId == teamId)).ToList();

        return new TeamStatsDto
        {
            TeamId = teamId,
            Backlog = tasks.Count(t => t.Status == TaskStatus.Review),
            Todo = tasks.Count(t => t.Status == TaskStatus.Todo),
            InProgress = tasks.Count(t => t.Status == TaskStatus.InProgress),
            Done = tasks.Count(t => t.Status == TaskStatus.Done)
        };
    }

    public async Task<IEnumerable<TeamMemberDto>> GetTeamMembersAsync(Guid teamId, Guid requestingUserId)
    {
        var team = await _unitOfWork.Teams.GetByIdAsync(teamId);
        if (team is null)
            throw new KeyNotFoundException("Team not found.");

        var actor = await GetApprovedActorAsync(requestingUserId);
        await EnsureTeamAccessAsync(teamId, actor);

        var memberships = await _unitOfWork.TeamMembers.FindAsync(tm => tm.TeamId == teamId);

        var result = new List<TeamMemberDto>();
        foreach (var membership in memberships)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(membership.UserId);
            if (user is null)
                continue;

            result.Add(new TeamMemberDto
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role
            });
        }

        return result;
    }

    public async Task<TeamInviteResponseDto> InviteToTeamAsync(Guid teamId, CreateTeamInviteDto dto, Guid invitedByUserId)
    {
        var team = await _unitOfWork.Teams.GetByIdAsync(teamId);
        if (team is null)
            throw new KeyNotFoundException("Team not found.");

        var actor = await GetApprovedActorAsync(invitedByUserId);
        if (actor.Role == Role.User)
            throw new UnauthorizedAccessException("Only Admins and TeamLeads can invite members.");

        if (actor.Role == Role.TeamLead)
        {
            await EnsureTeamAccessAsync(teamId, actor);
        }

        if (dto.Role == Role.Admin)
            throw new InvalidOperationException("Admin is a global role and cannot be invited to a team.");

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        var existingInvite = await _unitOfWork.TeamInvites
            .FirstOrDefaultAsync(i => i.TeamId == teamId
                && i.Email == normalizedEmail
                && i.Status == InviteStatus.Pending);

        if (existingInvite is not null)
            throw new InvalidOperationException("A pending invitation already exists for this email.");

        var invite = new TeamInvite
        {
            Id = Guid.NewGuid(),
            TeamId = teamId,
            Email = normalizedEmail,
            Role = dto.Role,
            Token = Guid.NewGuid().ToString("N"),
            Status = InviteStatus.Pending,
            ExpireAt = DateTime.UtcNow.AddDays(7)
        };

        await _unitOfWork.TeamInvites.AddAsync(invite);
        await AddAdminLogIfNeededAsync(actor, "Create", "TeamInvite", invite.Id, $"Created invite for '{dto.Email}' in team '{team.Name}'.");
        await _unitOfWork.SaveChangesAsync();

        return new TeamInviteResponseDto
        {
            Message = $"Invitation sent to {dto.Email}.",
            Token = invite.Token
        };
    }

    private async Task<User> GetApprovedActorAsync(Guid actorUserId)
    {
        var actor = await _unitOfWork.Users.GetByIdAsync(actorUserId);
        if (actor is null || !actor.IsApproved)
            throw new UnauthorizedAccessException("Only approved users can perform this action.");

        return actor;
    }

    private async Task EnsureTeamAccessAsync(Guid teamId, User actor)
    {
        if (actor.Role == Role.Admin)
            return;

        var isMember = await _unitOfWork.TeamMembers.AnyAsync(tm => tm.TeamId == teamId && tm.UserId == actor.Id);
        if (!isMember)
            throw new UnauthorizedAccessException("You are not a member of this team.");
    }

    private async Task<Guid?> ResolveTeamLeadIdAsync(Guid? requestedTeamLeadId, User actor)
    {
        Guid? assignedTeamLeadId = requestedTeamLeadId;

        if (actor.Role == Role.TeamLead)
        {
            if (assignedTeamLeadId.HasValue && assignedTeamLeadId.Value != actor.Id)
                throw new UnauthorizedAccessException("TeamLead can only assign themselves during team changes.");

            assignedTeamLeadId = actor.Id;
        }

        if (!assignedTeamLeadId.HasValue)
            return null;

        var selectedLead = await _unitOfWork.Users.GetByIdAsync(assignedTeamLeadId.Value);
        if (selectedLead is null || !selectedLead.IsApproved)
            throw new InvalidOperationException("Selected TeamLead not found or not approved.");

        if (selectedLead.Role != Role.TeamLead)
            throw new InvalidOperationException("Selected user must have TeamLead role.");

        return assignedTeamLeadId;
    }

    private async Task ApplyTeamLeadMembershipAsync(Guid teamId, Guid? teamLeadUserId)
    {
        if (!teamLeadUserId.HasValue)
            return;

        var membership = await _unitOfWork.TeamMembers
            .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == teamLeadUserId.Value);

        if (membership is null)
        {
            await _unitOfWork.TeamMembers.AddAsync(new TeamMember
            {
                Id = Guid.NewGuid(),
                TeamId = teamId,
                UserId = teamLeadUserId.Value,
                Role = Role.TeamLead
            });
            return;
        }

        if (membership.Role != Role.TeamLead)
        {
            membership.Role = Role.TeamLead;
            _unitOfWork.TeamMembers.Update(membership);
        }
    }

    private async Task<TeamResponseDto> BuildTeamResponseAsync(Team team)
    {
        var memberCount = (await _unitOfWork.TeamMembers.FindAsync(tm => tm.TeamId == team.Id)).Count();
        var tasks = (await _unitOfWork.TaskItems.FindAsync(t => t.TeamId == team.Id)).ToList();
        var completedTaskCount = tasks.Count(t => t.Status == TaskStatus.Done);
        var (teamLeadUserId, teamLeadName) = await GetTeamLeadAsync(team.Id);

        return new TeamResponseDto
        {
            Id = team.Id,
            Name = team.Name,
            Description = team.Description,
            TeamLeadUserId = teamLeadUserId,
            TeamLeadName = teamLeadName,
            MemberCount = memberCount,
            TaskCount = tasks.Count,
            CompletedTaskCount = completedTaskCount,
            CompletionPercentage = CalculatePercentage(completedTaskCount, tasks.Count),
            CreatedAt = team.CreatedAt
        };
    }

    private async Task<(Guid? TeamLeadUserId, string? TeamLeadName)> GetTeamLeadAsync(Guid teamId)
    {
        var leadMembership = (await _unitOfWork.TeamMembers
                .FindAsync(tm => tm.TeamId == teamId && tm.Role == Role.TeamLead))
            .FirstOrDefault();

        if (leadMembership is null)
            return (null, null);

        var leadUser = await _unitOfWork.Users.GetByIdAsync(leadMembership.UserId);
        if (leadUser is null)
            return (leadMembership.UserId, null);

        return (leadUser.Id, leadUser.FullName);
    }

    private async Task AddAdminLogIfNeededAsync(User actor, string action, string entityName, Guid? entityId, string description)
    {
        if (actor.Role != Role.Admin)
            return;

        await _unitOfWork.ActivityLogs.AddAsync(new ActivityLog
        {
            Id = Guid.NewGuid(),
            ActorUserId = actor.Id,
            ActorName = actor.FullName,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Description = description,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static decimal CalculatePercentage(int numerator, int denominator)
    {
        if (denominator == 0)
            return 0m;

        return Math.Round((decimal)numerator * 100m / denominator, 2);
    }
}
