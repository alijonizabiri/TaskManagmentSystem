using Microsoft.EntityFrameworkCore;
using TaskManagement.Domain.Entities;
using TaskManagement.Domain.Enums;
using TaskManagement.Infrastructure.Authentication;
using TaskManagement.Infrastructure.Data;

var email = "alijon@gmail.com".Trim().ToLowerInvariant();
var password = "12345";
var connectionString = "Host=localhost;Port=5432;Database=TaskManagementDb;Username=postgres;Password=12345";

var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql(connectionString)
    .Options;

await using var db = new AppDbContext(options);
await db.Database.MigrateAsync();

var hasher = new PasswordHasher();

var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
if (user is null)
{
    user = new User
    {
        Id = Guid.NewGuid(),
        FullName = "Alijon Admin",
        Email = email,
        PasswordHash = hasher.Hash(password),
        IsApproved = true,
        CreatedAt = DateTime.UtcNow,
        LastSeenAt = null
    };

    await db.Users.AddAsync(user);
    Console.WriteLine("Created user.");
}
else
{
    user.FullName = "Alijon Admin";
    user.PasswordHash = hasher.Hash(password);
    user.IsApproved = true;
    db.Users.Update(user);
    Console.WriteLine("Updated existing user.");
}

await db.SaveChangesAsync();

var team = await db.Teams.OrderBy(t => t.CreatedAt).FirstOrDefaultAsync();
if (team is null)
{
    team = new Team
    {
        Id = Guid.NewGuid(),
        Name = "Admin Team",
        CreatedBy = user.Id,
        CreatedAt = DateTime.UtcNow
    };

    await db.Teams.AddAsync(team);
    await db.SaveChangesAsync();
    Console.WriteLine("Created fallback team: Admin Team.");
}

var member = await db.TeamMembers.FirstOrDefaultAsync(tm => tm.TeamId == team.Id && tm.UserId == user.Id);
if (member is null)
{
    member = new TeamMember
    {
        Id = Guid.NewGuid(),
        TeamId = team.Id,
        UserId = user.Id,
        Role = Role.Admin
    };

    await db.TeamMembers.AddAsync(member);
    Console.WriteLine("Added admin membership to team.");
}
else
{
    member.Role = Role.Admin;
    db.TeamMembers.Update(member);
    Console.WriteLine("Ensured admin role in team membership.");
}

await db.SaveChangesAsync();

Console.WriteLine($"Done. Admin login: {email} / {password}");
