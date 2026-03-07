namespace TaskManagement.Application.Interfaces;

public interface ITaskAttachmentStorage
{
    Task<StoredTaskAttachmentFile> SaveAsync(
        Guid taskId,
        string fileName,
        byte[] content,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default);
}

public class StoredTaskAttachmentFile
{
    public string StoredFileName { get; init; } = string.Empty;
    public string RelativePath { get; init; } = string.Empty;
}
