using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.Application.DTOs.Common;
using TaskManagement.Application.DTOs.Task;
using TaskManagement.Application.Interfaces;

namespace TaskManagement.API.Controllers;

[ApiController]
[Route("tasks")]
[Authorize]
public class TasksController : BaseApiController
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    /// <summary>
    /// Create a task. Allowed for TeamLead and Admin.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "TeamLeadOrAdmin")]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
    {
        var userId = GetCurrentUserId();
        var task = await _taskService.CreateTaskAsync(dto, userId);
        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
    }

    /// <summary>
    /// Returns tasks visible to current actor.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTasks([FromQuery] Guid? teamId = null)
    {
        var userId = GetCurrentUserId();
        var tasks = await _taskService.GetTasksAsync(userId, teamId);
        return Ok(tasks);
    }

    /// <summary>
    /// Returns tasks visible to current actor.
    /// Endpoint kept for role-specific API contract.
    /// </summary>
    [HttpGet("my")]
    public async Task<IActionResult> GetMyTasks([FromQuery] Guid? teamId = null)
    {
        var userId = GetCurrentUserId();
        var tasks = await _taskService.GetTasksAsync(userId, teamId);
        return Ok(tasks);
    }

    [HttpGet("activities")]
    public async Task<IActionResult> GetActivities(
        [FromQuery] Guid teamId,
        [FromQuery] Guid? createdByUserId = null)
    {
        if (teamId == Guid.Empty)
            return BadRequest(new MessageResponseDto("teamId is required."));

        var userId = GetCurrentUserId();
        var activities = await _taskService.GetActivitiesAsync(userId, teamId, createdByUserId);
        return Ok(activities);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTask(Guid id)
    {
        var userId = GetCurrentUserId();
        var task = await _taskService.GetTaskByIdAsync(id, userId);
        return Ok(task);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateTaskStatus(Guid id, [FromBody] UpdateTaskStatusDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _taskService.UpdateTaskStatusAsync(id, dto, userId);

        if (!result.Success)
            return BadRequest(new MessageResponseDto(result.Message));

        return Ok(new MessageResponseDto(result.Message));
    }

    [HttpPatch("{id}/assign")]
    [Authorize(Policy = "TeamLeadOrAdmin")]
    public async Task<IActionResult> AssignTask(Guid id, [FromBody] AssignTaskDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _taskService.AssignTaskAsync(id, dto, userId);

        if (!result.Success)
            return BadRequest(new MessageResponseDto(result.Message));

        return Ok(new MessageResponseDto(result.Message));
    }
}