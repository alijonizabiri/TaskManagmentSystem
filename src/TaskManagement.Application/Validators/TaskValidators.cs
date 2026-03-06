using FluentValidation;
using TaskManagement.Application.DTOs.Task;

namespace TaskManagement.Application.Validators;

public class CreateTaskDtoValidator : AbstractValidator<CreateTaskDto>
{
    public CreateTaskDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Task title is required.")
            .MaximumLength(200).WithMessage("Task title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.");

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("A valid priority must be specified.");

        RuleFor(x => x.TeamId)
            .NotEmpty().WithMessage("Team ID is required.");

        RuleFor(x => x.Deadline)
            .Must(deadline => !deadline.HasValue || deadline.Value > DateTime.UtcNow)
            .WithMessage("Deadline must be in the future.");
    }
}

public class UpdateTaskStatusDtoValidator : AbstractValidator<UpdateTaskStatusDto>
{
    public UpdateTaskStatusDtoValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("A valid task status must be specified.");
    }
}

public class AssignTaskDtoValidator : AbstractValidator<AssignTaskDto>
{
    public AssignTaskDtoValidator()
    {
        RuleFor(x => x.AssigneeId)
            .NotEmpty().WithMessage("Assignee ID is required.");
    }
}
