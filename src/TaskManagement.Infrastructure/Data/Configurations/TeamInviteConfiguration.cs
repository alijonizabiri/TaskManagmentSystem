using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskManagement.Domain.Entities;

namespace TaskManagement.Infrastructure.Data.Configurations;

public class TeamInviteConfiguration : IEntityTypeConfiguration<TeamInvite>
{
    public void Configure(EntityTypeBuilder<TeamInvite> builder)
    {
        builder.HasKey(ti => ti.Id);

        builder.Property(ti => ti.Email)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(ti => ti.Token)
            .IsRequired()
            .HasMaxLength(100);

        // Unique index on token for fast lookups
        builder.HasIndex(ti => ti.Token).IsUnique();

        builder.Property(ti => ti.Role).IsRequired();
        builder.Property(ti => ti.Status).IsRequired();

        // TeamInvite -> Team relationship
        builder.HasOne(ti => ti.Team)
            .WithMany(t => t.Invites)
            .HasForeignKey(ti => ti.TeamId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
