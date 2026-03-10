using TaskManagement.Application.DTOs.Auth;

namespace TaskManagement.Application.Interfaces;

/// <summary>
/// Handles user registration and authentication.
/// </summary>
public interface IAuthService
{
    Task<MessageResult> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<AuthResponseDto> LoginTelegramBotAsync(TelegramBotLoginDto dto);
    Task<AuthResponseDto> LoginTelegramBotByUsernameAsync(TelegramBotUsernameLoginDto dto);
}

/// <summary>
/// Simple result wrapper for operations that return a message.
/// </summary>
public class MessageResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;

    public static MessageResult Ok(string message) => new() { Success = true, Message = message };
    public static MessageResult Fail(string message) => new() { Success = false, Message = message };
}
