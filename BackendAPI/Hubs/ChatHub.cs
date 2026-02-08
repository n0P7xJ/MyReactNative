using Microsoft.AspNetCore.SignalR;
using BackendAPI.Data;
using BackendAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Hubs
{
    /// <summary>
    /// SignalR Hub для обміну повідомленнями в реальному часі
    /// </summary>
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(ApplicationDbContext context, ILogger<ChatHub> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Підключення до групи розмови
        /// </summary>
        public async Task JoinConversation(string conversationId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
            _logger.LogInformation($"User {Context.ConnectionId} joined conversation {conversationId}");
        }

        /// <summary>
        /// Відключення від групи розмови
        /// </summary>
        public async Task LeaveConversation(string conversationId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
            _logger.LogInformation($"User {Context.ConnectionId} left conversation {conversationId}");
        }

        /// <summary>
        /// Відправка повідомлення
        /// </summary>
        public async Task SendMessage(int conversationId, int senderId, string content, string messageType = "text")
        {
            try
            {
                // Створення повідомлення в БД
                var message = new Message
                {
                    ConversationId = conversationId,
                    SenderId = senderId,
                    Content = content,
                    MessageType = messageType,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Messages.Add(message);
                
                // Оновлення часу останнього повідомлення в розмові
                var conversation = await _context.Conversations.FindAsync(conversationId);
                if (conversation != null)
                {
                    conversation.LastMessageAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                // Завантаження відправника для повного об'єкту
                await _context.Entry(message).Reference(m => m.Sender).LoadAsync();

                // Відправка повідомлення всім учасникам розмови
                await Clients.Group($"conversation_{conversationId}")
                    .SendAsync("ReceiveMessage", new
                    {
                        id = message.Id,
                        conversationId = message.ConversationId,
                        senderId = message.SenderId,
                        senderName = message.Sender?.FullName,
                        senderPhoto = message.Sender?.ProfilePhotoPath,
                        content = message.Content,
                        messageType = message.MessageType,
                        createdAt = message.CreatedAt,
                        isEdited = message.IsEdited
                    });

                _logger.LogInformation($"Message {message.Id} sent to conversation {conversationId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message");
                throw;
            }
        }

        /// <summary>
        /// Повідомлення про те, що користувач набирає текст
        /// </summary>
        public async Task UserTyping(int conversationId, int userId, string userName)
        {
            await Clients.GroupExcept($"conversation_{conversationId}", Context.ConnectionId)
                .SendAsync("UserTyping", new { conversationId, userId, userName });
        }

        /// <summary>
        /// Повідомлення про те, що користувач припинив набирати текст
        /// </summary>
        public async Task UserStoppedTyping(int conversationId, int userId)
        {
            await Clients.GroupExcept($"conversation_{conversationId}", Context.ConnectionId)
                .SendAsync("UserStoppedTyping", new { conversationId, userId });
        }

        /// <summary>
        /// Позначити повідомлення як прочитане
        /// </summary>
        public async Task MarkMessageAsRead(int messageId, int userId)
        {
            try
            {
                var message = await _context.Messages.FindAsync(messageId);
                if (message == null) return;

                // Перевірка, чи вже існує запис про прочитання
                var existingStatus = await _context.MessageReadStatuses
                    .FirstOrDefaultAsync(mrs => mrs.MessageId == messageId && mrs.UserId == userId);

                if (existingStatus == null)
                {
                    var readStatus = new MessageReadStatus
                    {
                        MessageId = messageId,
                        UserId = userId,
                        ReadAt = DateTime.UtcNow,
                        IsDelivered = true
                    };

                    _context.MessageReadStatuses.Add(readStatus);
                    await _context.SaveChangesAsync();

                    // Повідомити відправника про прочитання
                    await Clients.Group($"conversation_{message.ConversationId}")
                        .SendAsync("MessageRead", new { messageId, userId, readAt = readStatus.ReadAt });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking message as read");
            }
        }

        /// <summary>
        /// Редагування повідомлення
        /// </summary>
        public async Task EditMessage(int messageId, string newContent)
        {
            try
            {
                var message = await _context.Messages.FindAsync(messageId);
                if (message == null) return;

                message.Content = newContent;
                message.IsEdited = true;
                message.EditedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await Clients.Group($"conversation_{message.ConversationId}")
                    .SendAsync("MessageEdited", new 
                    { 
                        messageId = message.Id, 
                        content = message.Content, 
                        editedAt = message.EditedAt 
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error editing message");
            }
        }

        /// <summary>
        /// Видалення повідомлення
        /// </summary>
        public async Task DeleteMessage(int messageId)
        {
            try
            {
                var message = await _context.Messages.FindAsync(messageId);
                if (message == null) return;

                message.IsDeleted = true;
                message.Content = null; // Очищуємо контент

                await _context.SaveChangesAsync();

                await Clients.Group($"conversation_{message.ConversationId}")
                    .SendAsync("MessageDeleted", new { messageId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting message");
            }
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"Client connected: {Context.ConnectionId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }
    }
}
