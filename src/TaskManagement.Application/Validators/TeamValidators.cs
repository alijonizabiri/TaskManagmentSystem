using FluentValidation;
using TaskManagement.Application.DTOs.Team;
using TaskManagement.Domain.Enums;

namespace TaskManagement.Application.Validators;

public class CreateTeamDtoValidator : AbstractValidator<CreateTeamDto>
{
    public CreateTeamDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Team name is required.")
            .MaximumLength(100).WithMessage("Team name cannot exceed 100 characters.");
    }
}

public class CreateTeamInviteDtoValidator : AbstractValidator<CreateTeamInviteDto>
{
    public CreateTeamInviteDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Role)
            .Must(role => role == Role.User || role == Role.TeamLead)
            .WithMessage("Invite role must be User or TeamLead.");
    }
}