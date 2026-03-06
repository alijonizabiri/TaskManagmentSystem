namespace TaskManagement.Application.Interfaces;

/// <summary>
/// Abstraction for password hashing and verification.
/// Implemented in the Infrastructure layer using BCrypt.
/// </summary>
public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}
