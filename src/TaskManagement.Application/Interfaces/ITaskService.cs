using TaskManagement.Application.DTOs.Task;

namespace TaskManagement.Application.Interfaces;

/// <summary>
/// Task management operations: create, list, update status, assign.
/// </summary>
public interface ITaskService
{
    Task<TaskResponseDto> CreateTaskAsync(CreateTaskDto dto, Guid createdByUserId);
    Task<IEnumerable<TaskResponseDto>> GetTasksAsync(Guid requestingUserId, Guid? teamId = null);
    Task<IEnumerable<TaskResponseDto>> GetActivitiesAsync(
        Guid requestingUserId,
        Guid teamId,
        Guid? createdByUserId = null);
    Task<TaskResponseDto> GetTaskByIdAsync(Guid taskId, Guid requestingUserId);
    Task<MessageResult> UpdateTaskStatusAsync(Guid taskId, UpdateTaskStatusDto dto, Guid requestingUserId);
    Task<MessageResult> AssignTaskAsync(Guid taskId, AssignTaskDto dto, Guid requestingUserId);
}
