using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.Application.DTOs.Common;
using TaskManagement.Application.DTOs.Team;
using TaskManagement.Application.Interfaces;

namespace TaskManagement.API.Controllers;

[ApiController]
[Route("teams")]
[Authorize]
public class TeamsController : BaseApiController
{
    private readonly ITeamService _teamService;
    private readonly ITaskService _taskService;

    public TeamsController(ITeamService teamService, ITaskService taskService)
    {
        _teamService = teamService;
        _taskService = taskService;
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
        return CreatedAtAction(nameof(GetTeam), new { id = team.Id }, team);
    }

    /// <summary>
    /// Update a team. Allowed for TeamLead and Admin.
    /// </summary>
    [HttpPatch("{id}")]
    [Authorize(Policy = "TeamLeadOrAdmin")]
    public async Task<IActionResult> UpdateTeam(Guid id, [FromBody] UpdateTeamDto dto)
    {
        var userId = GetCurrentUserId();
        var team = await _teamService.UpdateTeamAsync(id, dto, userId);
        return Ok(team);
    }

    /// <summary>
    /// Delete a team. Allowed for TeamLead and Admin.
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = "TeamLeadOrAdmin")]
    public async Task<IActionResult> DeleteTeam(Guid id)
    {
        var userId = GetCurrentUserId();
        await _teamService.DeleteTeamAsync(id, userId);
        return Ok(new MessageResponseDto("Team deleted successfully."));
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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTeam(Guid id)
    {
        var userId = GetCurrentUserId();
        var team = await _teamService.GetTeamByIdAsync(id, userId);
        return Ok(team);
    }

    [HttpGet("{id}/stats")]
    public async Task<IActionResult> GetTeamStats(Guid id)
    {
        var userId = GetCurrentUserId();
        var stats = await _teamService.GetTeamStatsAsync(id, userId);
        return Ok(stats);
    }

    [HttpGet("{id}/tasks")]
    public async Task<IActionResult> GetTeamTasks(Guid id)
    {
        var userId = GetCurrentUserId();
        var tasks = await _taskService.GetTasksAsync(userId, id);
        return Ok(tasks);
    }

    [HttpGet("{id}/activities")]
    public async Task<IActionResult> GetTeamActivities(Guid id, [FromQuery] Guid? createdByUserId = null)
    {
        var userId = GetCurrentUserId();
        var activities = await _taskService.GetActivitiesAsync(userId, id, createdByUserId);
        return Ok(activities);
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
