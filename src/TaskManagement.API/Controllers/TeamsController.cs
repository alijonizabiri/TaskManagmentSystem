using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.Application.DTOs.Team;
using TaskManagement.Application.Interfaces;

namespace TaskManagement.API.Controllers;

[ApiController]
[Route("teams")]
[Authorize]
public class TeamsController : BaseApiController
{
    private readonly ITeamService _teamService;

    public TeamsController(ITeamService teamService)
    {
        _teamService = teamService;
    }

    /// <summary>
    /// Create a team. Allowed for TeamLead and Admin.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "TeamLeadOrAdmin")]
    public async Task<IActionResult> CreateTeam([FromBody] CreateTeamDto dto)
    {
        var userId = GetCurrentUserId();
        var team = await _teamService.CreateTeamAsync(dto, userId);
        return CreatedAtAction(nameof(GetTeamMembers), new { id = team.Id }, team);
    }

    /// <summary>
    /// Returns teams for the current actor membership scope.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTeams()
    {
        var userId = GetCurrentUserId();
        var teams = await _teamService.GetUserTeamsAsync(userId);
        return Ok(teams);
    }

    /// <summary>
    /// Returns teams where current user is a member.
    /// </summary>
    [HttpGet("my")]
    public async Task<IActionResult> GetMyTeams()
    {
        var userId = GetCurrentUserId();
        var teams = await _teamService.GetUserTeamsAsync(userId);
        return Ok(teams);
    }

    /// <summary>
    /// Returns members for a specific team with access checks.
    /// </summary>
    [HttpGet("{id}/members")]
    public async Task<IActionResult> GetTeamMembers(Guid id)
    {
        var userId = GetCurrentUserId();
        var members = await _teamService.GetTeamMembersAsync(id, userId);
        return Ok(members);
    }

    /// <summary>
    /// Invite member to a team. Allowed for TeamLead and Admin.
    /// </summary>
    [HttpPost("{id}/invite")]
    [Authorize(Policy = "TeamLeadOrAdmin")]
    public async Task<IActionResult> InviteToTeam(Guid id, [FromBody] CreateTeamInviteDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _teamService.InviteToTeamAsync(id, dto, userId);
        return Ok(result);
    }
}
