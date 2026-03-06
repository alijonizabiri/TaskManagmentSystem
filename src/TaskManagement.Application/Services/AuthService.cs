using TaskManagement.Application.DTOs.Auth;
using TaskManagement.Application.Interfaces;
using TaskManagement.Domain.Entities;
using TaskManagement.Domain.Enums;
using TaskManagement.Domain.Interfaces;

namespace TaskManagement.Application.Services;

/// <summary>
/// Handles user registration and login.
/// Registration creates an unapproved user; login checks approval status.
/// </summary>
public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtTokenProvider _jwtTokenProvider;
    private readonly IPasswordHasher _passwordHasher;

    public AuthService(
        IUnitOfWork unitOfWork,
        IJwtTokenProvider jwtTokenProvider,
        IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _jwtTokenProvider = jwtTokenProvider;
        _passwordHasher = passwordHasher;
    }

    public async Task<MessageResult> RegisterAsync(RegisterDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        var existingUser = await _unitOfWork.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (existingUser is not null)
            return MessageResult.Fail("A user with this email already exists.");

        var isFirstUser = !await _unitOfWork.Users.AnyAsync(_ => true);

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = dto.FullName,
            Email = normalizedEmail,
            PasswordHash = _passwordHasher.Hash(dto.Password),
            Role = isFirstUser ? Role.Admin : Role.User,
            IsApproved = isFirstUser,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return isFirstUser
            ? MessageResult.Ok("Registration successful. First user is automatically approved as Admin.")
            : MessageResult.Ok("Registration successful. Please wait for admin approval.");
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _unitOfWork.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLowerInvariant());

        if (user is null)
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!_passwordHasher.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!user.IsApproved)
            throw new UnauthorizedAccessException("Your account has not been approved yet.");

        user.LastSeenAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        var token = _jwtTokenProvider.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        };
    }
}
