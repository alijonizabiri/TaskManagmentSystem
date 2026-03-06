using TaskManagement.Domain.Entities;

namespace TaskManagement.Application.Interfaces;

/// <summary>
/// Abstraction for JWT token generation.
/// Implemented in the Infrastructure layer.
/// </summary>
public interface IJwtTokenProvider
{
    string GenerateToken(User user);
}
