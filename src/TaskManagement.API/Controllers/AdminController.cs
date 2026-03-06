using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.Application.DTOs.Admin;
using TaskManagement.Application.DTOs.Common;
using TaskManagement.Application.Interfaces;

namespace TaskManagement.API.Controllers;

/// <summary>
/// Admin-only endpoints for global user/team/task management.
/// </summary>
[ApiController]
[Route("admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : BaseApiController
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var actorUserId = GetCurrentUserId();
        var users = await _adminService.GetUsersAsync(actorUserId);
        return Ok(users);
    }

    [HttpGet("users/pending")]
    public async Task<IActionResult> GetPendingUsers()
    {
        var actorUserId = GetCurrentUserId();
        var users = await _adminService.GetPendingUsersAsync(actorUserId);
        return Ok(users);
    }

    [HttpPost("users/{id}/approve")]
    public async Task<IActionResult> ApproveUser(Guid id)
    {
        var actorUserId = GetCurrentUserId();
        var result = await _adminService.ApproveUserAsync(actorUserId, id);

        if (!result.Success)
            return BadRequest(new MessageResponseDto(result.Message));

        return Ok(new MessageResponseDto(result.Message));
    }

    [HttpPost("users/{id}/reject")]
    public async Task<IActionResult> RejectUser(Guid id)
    {
        var actorUserId = GetCurrentUserId();
        var result = await _adminService.RejectUserAsync(actorUserId, id);

        if (!result.Success)
            return BadRequest(new MessageResponseDto(result.Message));

        return Ok(new MessageResponseDto(result.Message));
    }

    [HttpPatch("users/{id}/role")]
    public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] UpdateUserRoleDto dto)
    {
        var actorUserId = GetCurrentUserId();
        var result = await _adminService.UpdateUserRoleAsync(actorUserId, id, dto.Role);

        if (!result.Success)
            return BadRequest(new MessageResponseDto(result.Message));

        return Ok(new MessageResponseDto(result.Message));
    }

    [HttpGet("teams")]
    public async Task<IActionResult> GetAllTeams()
    {
        var actorUserId = GetCurrentUserId();
        var teams = await _adminService.GetAllTeamsAsync(actorUserId);
        return Ok(teams);
    }

    [HttpGet("tasks")]
    public async Task<IActionResult> GetAllTasks()
    {
        var actorUserId = GetCurrentUserId();
        var tasks = await _adminService.GetAllTasksAsync(actorUserId);
        return Ok(tasks);
    }

    [HttpPost("teams/{teamId}/members/{userId}")]
    public async Task<IActionResult> AddUserToTeam(Guid teamId, Guid userId)
    {
        var actorUserId = GetCurrentUserId();
        var result = await _adminService.AddUserToTeamAsync(actorUserId, teamId, userId);

        if (!result.Success)
            return BadRequest(new MessageResponseDto(result.Message));

        return Ok(new MessageResponseDto(result.Message));
    }
}