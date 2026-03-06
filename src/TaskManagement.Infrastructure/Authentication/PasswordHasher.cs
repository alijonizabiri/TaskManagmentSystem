using TaskManagement.Application.Interfaces;

namespace TaskManagement.Infrastructure.Authentication;

/// <summary>
/// BCrypt-based password hashing implementation.
/// Uses a work factor of 12 for production-grade security.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
    }

    public bool Verify(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
