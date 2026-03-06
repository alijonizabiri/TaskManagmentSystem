namespace TaskManagement.Application.DTOs.Common;

/// <summary>
/// Generic message response DTO used for simple success/error messages.
/// </summary>
public class MessageResponseDto
{
    public string Message { get; set; } = string.Empty;

    public MessageResponseDto() { }

    public MessageResponseDto(string message)
    {
        Message = message;
    }
}
