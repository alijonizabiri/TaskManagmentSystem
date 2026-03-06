using FluentValidation;
using TaskManagement.Application.DTOs.Admin;

namespace TaskManagement.Application.Validators;

public class UpdateUserRoleDtoValidator : AbstractValidator<UpdateUserRoleDto>
{
    public UpdateUserRoleDtoValidator()
    {
        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("A valid role must be specified.");
    }
}