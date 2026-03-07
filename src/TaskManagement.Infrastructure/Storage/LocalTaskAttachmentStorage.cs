using TaskManagement.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace TaskManagement.Infrastructure.Storage;

public class LocalTaskAttachmentStorage : ITaskAttachmentStorage
{
    private readonly string _storageRootPath;

    public LocalTaskAttachmentStorage(IConfiguration configuration)
    {
        _storageRootPath = configuration["FileStorage:RootPath"]
            ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
    }

    public async Task<StoredTaskAttachmentFile> SaveAsync(
        Guid taskId,
        string fileName,
        byte[] content,
        CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(_storageRootPath);

        var extension = Path.GetExtension(fileName);
        var storedFileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}{extension}";
        var directory = Path.Combine(_storageRootPath, "uploads", "tasks", taskId.ToString("N"));
        Directory.CreateDirectory(directory);

        var fullPath = Path.Combine(directory, storedFileName);
        await File.WriteAllBytesAsync(fullPath, content, cancellationToken);

        return new StoredTaskAttachmentFile
        {
            StoredFileName = storedFileName,
            RelativePath = Path.Combine("uploads", "tasks", taskId.ToString("N"), storedFileName)
        };
    }

    public Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return Task.CompletedTask;

        var normalizedPath = relativePath.Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.Combine(_storageRootPath, normalizedPath);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }
}
