using System.ComponentModel.DataAnnotations;
using TaskManagement.Domain.Enums;

namespace TaskManagement.Application.DTOs.Auth;

/// <summary>
/// Request DTO for user registration.
/// </summary>
public class RegisterDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

/// <summary>
/// Request DTO for user login.
/// </summary>
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Response DTO returned after successful authentication.
/// </summary>
public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Role Role { get; set; }
}

public class TelegramLinkCodeResponseDto
{
    public string Code { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

public class TelegramBotLoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public long ChatId { get; set; }
    public string? TelegramUsername { get; set; }
}

public class TelegramBotUsernameLoginDto
{
    public long ChatId { get; set; }
    public string TelegramUsername { get; set; } = string.Empty;
}
