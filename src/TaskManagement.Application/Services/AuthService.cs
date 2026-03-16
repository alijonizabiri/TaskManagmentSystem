using System.Security.Cryptography;
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
        var user = await GetApprovedUserByCredentialsAsync(dto.Email, dto.Password);

        user.LastSeenAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> LoginTelegramBotAsync(TelegramBotLoginDto dto)
    {
        var user = await GetApprovedUserByCredentialsAsync(dto.Email, dto.Password);
        await AttachTelegramIdentityAsync(user, dto.ChatId, dto.TelegramUsername);
        return BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> LoginTelegramBotByUsernameAsync(TelegramBotUsernameLoginDto dto)
    {
        var normalizedTelegramUsername = NormalizeTelegramUsername(dto.TelegramUsername)
            ?? throw new UnauthorizedAccessException("Telegram username is required.");

        var user = await _unitOfWork.Users
            .FirstOrDefaultAsync(u => u.TelegramUsername == normalizedTelegramUsername);

        if (user is null)
            throw new UnauthorizedAccessException("Telegram username is not linked to any account.");

        if (!user.IsApproved)
            throw new UnauthorizedAccessException("Your account has not been approved yet.");

        await AttachTelegramIdentityAsync(user, dto.ChatId, normalizedTelegramUsername);
        return BuildAuthResponse(user);
    }

    private static string GenerateTelegramLinkCode()
    {
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Span<char> chars = stackalloc char[8];
        Span<byte> bytes = stackalloc byte[8];
        RandomNumberGenerator.Fill(bytes);

        for (var i = 0; i < chars.Length; i++)
            chars[i] = alphabet[bytes[i] % alphabet.Length];

        return new string(chars);
    }

    private async Task<User> GetApprovedUserByCredentialsAsync(string email, string password)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user is null || !_passwordHasher.Verify(password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!user.IsApproved)
            throw new UnauthorizedAccessException("Your account has not been approved yet.");

        return user;
    }

    private async Task AttachTelegramIdentityAsync(User user, long chatId, string? telegramUsername)
    {
        var normalizedTelegramUsername = NormalizeTelegramUsername(telegramUsername);

        var existingLink = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.TelegramChatId == chatId);
        if (existingLink is not null && existingLink.Id != user.Id)
            throw new InvalidOperationException("This Telegram chat is already linked to another account.");

        if (normalizedTelegramUsername is not null)
        {
            var existingUsername = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.TelegramUsername == normalizedTelegramUsername);
            if (existingUsername is not null && existingUsername.Id != user.Id)
                throw new InvalidOperationException("This Telegram username is already linked to another account.");
        }

        user.TelegramChatId = chatId;
        if (normalizedTelegramUsername is not null)
            user.TelegramUsername = normalizedTelegramUsername;

        user.LastSeenAt = DateTime.UtcNow;
        user.TelegramLinkCode = null;
        user.TelegramLinkCodeExpiresAt = null;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();
    }

    private AuthResponseDto BuildAuthResponse(User user)
    {
        var token = _jwtTokenProvider.GenerateToken(user);
        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        };
    }

    private static string? NormalizeTelegramUsername(string? telegramUsername)
    {
        if (string.IsNullOrWhiteSpace(telegramUsername))
            return null;

        var normalized = telegramUsername.Trim().TrimStart('@').ToLowerInvariant();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }
}
