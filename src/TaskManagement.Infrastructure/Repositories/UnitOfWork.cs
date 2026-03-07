using TaskManagement.Domain.Entities;
using TaskManagement.Domain.Interfaces;
using TaskManagement.Infrastructure.Data;

namespace TaskManagement.Infrastructure.Repositories;

/// <summary>
/// Unit of Work implementation — coordinates all repositories
/// and commits changes in a single transaction.
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IRepository<User>? _users;
    private IRepository<Team>? _teams;
    private IRepository<TeamMember>? _teamMembers;
    private IRepository<TeamInvite>? _teamInvites;
    private IRepository<TaskItem>? _taskItems;
    private IRepository<TaskAttachment>? _taskAttachments;
    private IRepository<ActivityLog>? _activityLogs;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    // Lazy initialization — repositories are created only when first accessed
    public IRepository<User> Users =>
        _users ??= new GenericRepository<User>(_context);

    public IRepository<Team> Teams =>
        _teams ??= new GenericRepository<Team>(_context);

    public IRepository<TeamMember> TeamMembers =>
        _teamMembers ??= new GenericRepository<TeamMember>(_context);

    public IRepository<TeamInvite> TeamInvites =>
        _teamInvites ??= new GenericRepository<TeamInvite>(_context);

    public IRepository<TaskItem> TaskItems =>
        _taskItems ??= new GenericRepository<TaskItem>(_context);

    public IRepository<TaskAttachment> TaskAttachments =>
        _taskAttachments ??= new GenericRepository<TaskAttachment>(_context);

    public IRepository<ActivityLog> ActivityLogs =>
        _activityLogs ??= new GenericRepository<ActivityLog>(_context);

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
