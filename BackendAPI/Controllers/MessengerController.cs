using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BackendAPI.Data;
using BackendAPI.Models;
using BackendAPI.Models.DTOs;

namespace BackendAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessengerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MessengerController> _logger;

        public MessengerController(ApplicationDbContext context, ILogger<MessengerController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Створити нову розмову
        /// </summary>
        [HttpPost("conversations")]
        public async Task<ActionResult<ConversationDto>> CreateConversation([FromBody] CreateConversationDto dto)
        {
            try
            {
                // Перевірка, чи існує приватна розмова між двома користувачами
                if (!dto.IsGroup && dto.ParticipantIds.Count == 1)
                {
                    var existingConversation = await _context.Conversations
                        .Include(c => c.Participants)
                        .Where(c => !c.IsGroup)
                        .Where(c => c.Participants.Any(p => p.UserId == dto.CreatedById))
                        .Where(c => c.Participants.Any(p => p.UserId == dto.ParticipantIds[0]))
                        .FirstOrDefaultAsync();

                    if (existingConversation != null)
                    {
                        return await GetConversationDto(existingConversation.Id, dto.CreatedById);
                    }
                }

                // Створення нової розмови
                var conversation = new Conversation
                {
                    Name = dto.GroupName,
                    IsGroup = dto.IsGroup,
                    CreatedById = dto.CreatedById,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Conversations.Add(conversation);
                await _context.SaveChangesAsync();

                // Додавання учасників
                var participants = new List<ConversationParticipant>
                {
                    new ConversationParticipant
                    {
                        ConversationId = conversation.Id,
                        UserId = dto.CreatedById,
                        Role = dto.IsGroup ? "admin" : "member",
                        JoinedAt = DateTime.UtcNow
                    }
                };

                foreach (var participantId in dto.ParticipantIds)
                {
                    if (participantId != dto.CreatedById)
                    {
                        participants.Add(new ConversationParticipant
                        {
                            ConversationId = conversation.Id,
                            UserId = participantId,
                            Role = "member",
                            JoinedAt = DateTime.UtcNow
                        });
                    }
                }

                _context.ConversationParticipants.AddRange(participants);
                await _context.SaveChangesAsync();

                return await GetConversationDto(conversation.Id, dto.CreatedById);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating conversation");
                return StatusCode(500, "Помилка при створенні розмови");
            }
        }

        /// <summary>
        /// Отримати всі розмови користувача
        /// </summary>
        [HttpGet("conversations/{userId}")]
        public async Task<ActionResult<List<ConversationDto>>> GetUserConversations(int userId)
        {
            try
            {
                var conversations = await _context.ConversationParticipants
                    .Where(cp => cp.UserId == userId && cp.IsActive)
                    .Include(cp => cp.Conversation)
                        .ThenInclude(c => c.Participants)
                        .ThenInclude(p => p.User)
                    .Include(cp => cp.Conversation)
                        .ThenInclude(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                        .ThenInclude(m => m.Sender)
                    .Select(cp => cp.Conversation)
                    .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
                    .ToListAsync();

                var result = new List<ConversationDto>();

                foreach (var conv in conversations)
                {
                    if (conv != null)
                    {
                        result.Add(await GetConversationDtoFromEntity(conv, userId));
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user conversations");
                return StatusCode(500, "Помилка при отриманні розмов");
            }
        }

        /// <summary>
        /// Отримати повідомлення з розмови
        /// </summary>
        [HttpGet("conversations/{conversationId}/messages")]
        public async Task<ActionResult<List<MessageDto>>> GetConversationMessages(
            int conversationId, 
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var messages = await _context.Messages
                    .Where(m => m.ConversationId == conversationId && !m.IsDeleted)
                    .Include(m => m.Sender)
                    .Include(m => m.ReadStatuses)
                    .OrderByDescending(m => m.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var result = messages.Select(m => new MessageDto
                {
                    Id = m.Id,
                    ConversationId = m.ConversationId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender?.FullName ?? "",
                    SenderPhoto = m.Sender?.ProfilePhotoPath,
                    Content = m.Content,
                    MessageType = m.MessageType,
                    FilePath = m.FilePath,
                    FileName = m.FileName,
                    FileSize = m.FileSize,
                    ReplyToMessageId = m.ReplyToMessageId,
                    IsEdited = m.IsEdited,
                    IsDeleted = m.IsDeleted,
                    CreatedAt = m.CreatedAt,
                    EditedAt = m.EditedAt,
                    ReadStatuses = m.ReadStatuses.Select(rs => new ReadStatusDto
                    {
                        UserId = rs.UserId,
                        ReadAt = rs.ReadAt,
                        IsDelivered = rs.IsDelivered
                    }).ToList()
                }).Reverse().ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting conversation messages");
                return StatusCode(500, "Помилка при отриманні повідомлень");
            }
        }

        /// <summary>
        /// Позначити всі повідомлення як прочитані
        /// </summary>
        [HttpPost("conversations/{conversationId}/read")]
        public async Task<IActionResult> MarkConversationAsRead(int conversationId, [FromQuery] int userId)
        {
            try
            {
                var unreadMessages = await _context.Messages
                    .Where(m => m.ConversationId == conversationId && m.SenderId != userId)
                    .Where(m => !m.ReadStatuses.Any(rs => rs.UserId == userId))
                    .ToListAsync();

                foreach (var message in unreadMessages)
                {
                    _context.MessageReadStatuses.Add(new MessageReadStatus
                    {
                        MessageId = message.Id,
                        UserId = userId,
                        ReadAt = DateTime.UtcNow,
                        IsDelivered = true
                    });
                }

                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking conversation as read");
                return StatusCode(500, "Помилка при позначенні як прочитане");
            }
        }

        private async Task<ConversationDto> GetConversationDto(int conversationId, int currentUserId)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Participants)
                    .ThenInclude(p => p.User)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                    .ThenInclude(m => m.Sender)
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation == null)
                throw new Exception("Conversation not found");

            return await GetConversationDtoFromEntity(conversation, currentUserId);
        }

        private async Task<ConversationDto> GetConversationDtoFromEntity(Conversation conversation, int currentUserId)
        {
            var unreadCount = await _context.Messages
                .Where(m => m.ConversationId == conversation.Id && m.SenderId != currentUserId)
                .Where(m => !m.ReadStatuses.Any(rs => rs.UserId == currentUserId))
                .CountAsync();

            var lastMessage = conversation.Messages?.FirstOrDefault();

            return new ConversationDto
            {
                Id = conversation.Id,
                Name = conversation.IsGroup 
                    ? conversation.Name 
                    : conversation.Participants
                        .FirstOrDefault(p => p.UserId != currentUserId)?.User?.FullName,
                IsGroup = conversation.IsGroup,
                GroupPhotoPath = conversation.IsGroup 
                    ? conversation.GroupPhotoPath 
                    : conversation.Participants
                        .FirstOrDefault(p => p.UserId != currentUserId)?.User?.ProfilePhotoPath,
                CreatedAt = conversation.CreatedAt,
                LastMessageAt = conversation.LastMessageAt,
                Participants = conversation.Participants.Select(p => new ConversationParticipantDto
                {
                    UserId = p.UserId,
                    FirstName = p.User?.FirstName ?? "",
                    LastName = p.User?.LastName ?? "",
                    ProfilePhotoPath = p.User?.ProfilePhotoPath,
                    Role = p.Role,
                    IsActive = p.IsActive
                }).ToList(),
                LastMessage = lastMessage != null ? new MessageDto
                {
                    Id = lastMessage.Id,
                    ConversationId = lastMessage.ConversationId,
                    SenderId = lastMessage.SenderId,
                    SenderName = lastMessage.Sender?.FullName ?? "",
                    Content = lastMessage.Content,
                    MessageType = lastMessage.MessageType,
                    CreatedAt = lastMessage.CreatedAt,
                    IsEdited = lastMessage.IsEdited,
                    IsDeleted = lastMessage.IsDeleted
                } : null,
                UnreadCount = unreadCount
            };
        }
    }
}
