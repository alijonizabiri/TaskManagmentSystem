using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskManagement.Domain.Entities;

namespace TaskManagement.Infrastructure.Data.Configurations;

public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ActorName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(x => x.Action)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(x => x.EntityName)
            .IsRequired()
            .HasMaxLength(80);

        builder.Property(x => x.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(x => x.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.HasIndex(x => x.CreatedAt);
        builder.HasIndex(x => x.ActorUserId);
        builder.HasIndex(x => x.Action);
        builder.HasIndex(x => x.EntityName);

        builder.HasOne(x => x.Actor)
            .WithMany(u => u.ActivityLogs)
            .HasForeignKey(x => x.ActorUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
