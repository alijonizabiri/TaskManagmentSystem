using TaskManagement.Application.DTOs.Team;
using TaskManagement.Application.Interfaces;
using TaskManagement.Domain.Entities;
using TaskManagement.Domain.Enums;
using TaskManagement.Domain.Interfaces;

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

    /// <summary>
    /// Admin and TeamLead can create teams.
    /// Admin remains global (no team membership); TeamLead is added to the team.
    /// </summary>
    public async Task<TeamResponseDto> CreateTeamAsync(CreateTeamDto dto, Guid createdByUserId)
    {
        var actor = await GetApprovedActorAsync(createdByUserId);

        if (actor.Role != Role.Admin && actor.Role != Role.TeamLead)
            throw new UnauthorizedAccessException("Only Admins and TeamLeads can create teams.");

        var team = new Team
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            CreatedBy = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Teams.AddAsync(team);

        var memberCount = 0;
        if (actor.Role == Role.TeamLead)
        {
            await _unitOfWork.TeamMembers.AddAsync(new TeamMember
            {
                Id = Guid.NewGuid(),
                TeamId = team.Id,
                UserId = createdByUserId,
                Role = Role.TeamLead
            });

            memberCount = 1;
        }

        await _unitOfWork.SaveChangesAsync();

        return new TeamResponseDto
        {
            Id = team.Id,
            Name = team.Name,
            MemberCount = memberCount,
            CreatedAt = team.CreatedAt
        };
    }

    /// <summary>
    /// Returns teams where the actor is a member.
    /// Admin users are global and do not belong to teams, so this returns empty for Admin.
    /// </summary>
    public async Task<IEnumerable<TeamResponseDto>> GetUserTeamsAsync(Guid userId)
    {
        var actor = await GetApprovedActorAsync(userId);
        if (actor.Role == Role.Admin)
            return Enumerable.Empty<TeamResponseDto>();

        var memberships = await _unitOfWork.TeamMembers.FindAsync(tm => tm.UserId == userId);
        var teamIds = memberships.Select(m => m.TeamId).Distinct().ToList();

        var result = new List<TeamResponseDto>();
        foreach (var teamId in teamIds)
        {
            var team = await _unitOfWork.Teams.GetByIdAsync(teamId);
            if (team is null)
                continue;

            var memberCount = (await _unitOfWork.TeamMembers
                .FindAsync(tm => tm.TeamId == teamId))
                .Count();

            result.Add(new TeamResponseDto
            {
                Id = team.Id,
                Name = team.Name,
                MemberCount = memberCount,
                CreatedAt = team.CreatedAt
            });
        }

        return result;
    }

    /// <summary>
    /// Admin can view any team members; TeamLead/User can view only teams they belong to.
    /// </summary>
    public async Task<IEnumerable<TeamMemberDto>> GetTeamMembersAsync(Guid teamId, Guid requestingUserId)
    {
        var team = await _unitOfWork.Teams.GetByIdAsync(teamId);
        if (team is null)
            throw new KeyNotFoundException("Team not found.");

        var actor = await GetApprovedActorAsync(requestingUserId);
        if (actor.Role != Role.Admin)
        {
            var isMember = await _unitOfWork.TeamMembers
                .AnyAsync(tm => tm.TeamId == teamId && tm.UserId == requestingUserId);

            if (!isMember)
                throw new UnauthorizedAccessException("You are not a member of this team.");
        }

        var memberships = await _unitOfWork.TeamMembers
            .FindAsync(tm => tm.TeamId == teamId);

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

    /// <summary>
    /// Admin can invite to any team; TeamLead can invite only to teams they belong to.
    /// </summary>
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
            var isTeamMember = await _unitOfWork.TeamMembers
                .AnyAsync(tm => tm.TeamId == teamId && tm.UserId == invitedByUserId);

            if (!isTeamMember)
                throw new UnauthorizedAccessException("TeamLead can only invite members to teams they belong to.");
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
}