using TaskManagement.Domain.Entities;

namespace TaskManagement.Domain.Interfaces;

/// <summary>
/// Unit of Work pattern — coordinates multiple repository operations
/// under a single database transaction.
/// </summary>
public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<Team> Teams { get; }
    IRepository<TeamMember> TeamMembers { get; }
    IRepository<TeamInvite> TeamInvites { get; }
    IRepository<TaskItem> TaskItems { get; }
    IRepository<TaskAttachment> TaskAttachments { get; }
    IRepository<ActivityLog> ActivityLogs { get; }

    /// <summary>
    /// Commits all pending changes to the database.
    /// </summary>
    Task<int> SaveChangesAsync();
}
