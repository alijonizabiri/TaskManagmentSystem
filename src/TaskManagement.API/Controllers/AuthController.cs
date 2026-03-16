using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.Application.DTOs.Auth;
using TaskManagement.Application.DTOs.Common;
using TaskManagement.Application.Interfaces;

namespace TaskManagement.API.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Register a new user account.
    /// The account requires admin approval before the user can log in.
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(dto);

        if (!result.Success)
            return BadRequest(new MessageResponseDto(result.Message));

        return Ok(new MessageResponseDto(result.Message));
    }

    /// <summary>
    /// Authenticate a user and receive a JWT token.
    /// Only approved users can log in.
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var response = await _authService.LoginAsync(dto);
        return Ok(response);
    }

    [HttpPost("telegram-bot/login")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginTelegramBot([FromBody] TelegramBotLoginDto dto)
    {
        var response = await _authService.LoginTelegramBotAsync(dto);
        return Ok(response);
    }

    [HttpPost("telegram-bot/username-login")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginTelegramBotByUsername([FromBody] TelegramBotUsernameLoginDto dto)
    {
        var response = await _authService.LoginTelegramBotByUsernameAsync(dto);
        return Ok(response);
    }
}
