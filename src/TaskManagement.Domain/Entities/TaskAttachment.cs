namespace TaskManagement.Domain.Entities;

/// <summary>
/// File attachment linked to a task item.
/// </summary>
public class TaskAttachment
{
    public Guid Id { get; set; }
    public Guid TaskItemId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public Guid UploadedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public TaskItem TaskItem { get; set; } = null!;
    public User UploadedByUser { get; set; } = null!;
}
