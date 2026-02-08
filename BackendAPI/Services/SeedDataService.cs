using BackendAPI.Data;
using BackendAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Services
{
    public interface ISeedDataService
    {
        Task InitializeTestDataAsync();
    }

    public class SeedDataService : ISeedDataService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SeedDataService> _logger;

        public SeedDataService(ApplicationDbContext context, ILogger<SeedDataService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task InitializeTestDataAsync()
        {
            try
            {
                // Перевіряємо, чи вже існують тестові дані
                var existingUser = await _context.Users.FirstOrDefaultAsync();
                if (existingUser != null)
                {
                    _logger.LogInformation("✅ Тестові дані вже існують");
                    return;
                }

                _logger.LogInformation("🌱 Ініціалізація тестових даних...");

                // Створюємо тестових користувачів
                var user1 = new User
                {
                    FirstName = "Тест",
                    LastName = "Користувач 1",
                    Email = "test1@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123"),
                    Phone = "+380971234567",
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                var user2 = new User
                {
                    FirstName = "Тест",
                    LastName = "Користувач 2",
                    Email = "test2@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123"),
                    Phone = "+380971234568",
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.Users.Add(user1);
                _context.Users.Add(user2);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Користувачі створені");

                // Створюємо тестову розмову
                var conversation = new Conversation
                {
                    IsGroup = false,
                    CreatedById = user1.Id,
                    CreatedAt = DateTime.UtcNow,
                    LastMessageAt = null
                };

                _context.Conversations.Add(conversation);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Розмова створена (ID: {conversation.Id})");

                // Додаємо учасників
                var participant1 = new ConversationParticipant
                {
                    ConversationId = conversation.Id,
                    UserId = user1.Id,
                    Role = "member",
                    JoinedAt = DateTime.UtcNow,
                    IsActive = true
                };

                var participant2 = new ConversationParticipant
                {
                    ConversationId = conversation.Id,
                    UserId = user2.Id,
                    Role = "member",
                    JoinedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.ConversationParticipants.Add(participant1);
                _context.ConversationParticipants.Add(participant2);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Учасники додані");

                // Додаємо тестові повідомлення
                var testMessage = new Message
                {
                    ConversationId = conversation.Id,
                    SenderId = user1.Id,
                    Content = "Привіт! Це тестове повідомлення",
                    MessageType = "text",
                    CreatedAt = DateTime.UtcNow,
                    IsEdited = false,
                    IsDeleted = false
                };

                _context.Messages.Add(testMessage);
                conversation.LastMessageAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Тестові дані успішно ініціалізовані!");
                _logger.LogInformation($"📧 Email: {user1.Email}, Пароль: Test@123");
                _logger.LogInformation($"📧 Email: {user2.Email}, Пароль: Test@123");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Помилка при ініціалізації тестових даних");
            }
        }
    }
}
