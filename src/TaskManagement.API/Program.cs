using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Extensions;
using TaskManagement.API.Middleware;
using TaskManagement.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDatabase(builder.Configuration);
builder.Services.AddRepositories();
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices();
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddValidation();

builder.Services.AddControllers();
builder.Services.AddSwaggerDocumentation();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
    dbContext.Database.ExecuteSqlRaw("""
        ALTER TABLE "Users"
        ADD COLUMN IF NOT EXISTS "TelegramChatId" bigint NULL;

        ALTER TABLE "Users"
        ADD COLUMN IF NOT EXISTS "TelegramLinkCode" character varying(32) NULL;

        ALTER TABLE "Users"
        ADD COLUMN IF NOT EXISTS "TelegramLinkCodeExpiresAt" timestamp with time zone NULL;

        ALTER TABLE "Users"
        ADD COLUMN IF NOT EXISTS "TelegramUsername" character varying(64) NULL;

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_TelegramChatId"
        ON "Users" ("TelegramChatId");

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_TelegramUsername"
        ON "Users" ("TelegramUsername");
        """);
}

app.Run();
