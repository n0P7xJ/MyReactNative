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
                    CreatedAt = DateTime.UtcNow,
                    InviteToken = dto.IsGroup ? GenerateInviteToken() : null,
                    IsInviteLinkActive = dto.IsGroup
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
                // Спрощений запит без складних ThenInclude для SQLite
                var conversationParticipants = await _context.ConversationParticipants
                    .Where(cp => cp.UserId == userId && cp.IsActive)
                    .Include(cp => cp.Conversation!)
                        .ThenInclude(c => c!.Participants)
                        .ThenInclude(p => p.User)
                    .ToListAsync();

                var conversations = conversationParticipants
                    .Select(cp => cp.Conversation)
                    .Where(c => c != null)
                    .Distinct()
                    .OrderByDescending(c => c!.LastMessageAt ?? c.CreatedAt)
                    .ToList();

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

            // Завантажуємо останнє повідомлення окремим запитом для сумісності з SQLite
            var lastMessage = await _context.Messages
                .Where(m => m.ConversationId == conversation.Id && !m.IsDeleted)
                .Include(m => m.Sender)
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefaultAsync();

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
                InviteToken = conversation.InviteToken,
                IsInviteLinkActive = conversation.IsInviteLinkActive,
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

        /// <summary>
        /// Приєднатися до групового чату за посиланням
        /// </summary>
        [HttpPost("conversations/join")]
        public async Task<ActionResult<ConversationDto>> JoinByInvite([FromBody] JoinByInviteDto dto)
        {
            try
            {
                var conversation = await _context.Conversations
                    .Include(c => c.Participants)
                    .FirstOrDefaultAsync(c => c.InviteToken == dto.InviteToken);

                if (conversation == null)
                {
                    return NotFound("Посилання на чат не знайдено");
                }

                if (!conversation.IsGroup)
                {
                    return BadRequest("Неможливо приєднатися до приватного чату");
                }

                if (!conversation.IsInviteLinkActive)
                {
                    return BadRequest("Посилання-запрошення неактивне");
                }

                // Перевірка, чи користувач вже учасник
                var existingParticipant = conversation.Participants
                    .FirstOrDefault(p => p.UserId == dto.UserId);

                if (existingParticipant != null)
                {
                    if (existingParticipant.IsActive)
                    {
                        return BadRequest("Ви вже є учасником цього чату");
                    }
                    else
                    {
                        // Реактивувати учасника
                        existingParticipant.IsActive = true;
                        existingParticipant.JoinedAt = DateTime.UtcNow;
                    }
                }
                else
                {
                    // Додати нового учасника
                    _context.ConversationParticipants.Add(new ConversationParticipant
                    {
                        ConversationId = conversation.Id,
                        UserId = dto.UserId,
                        Role = "member",
                        JoinedAt = DateTime.UtcNow,
                        IsActive = true
                    });
                }

                await _context.SaveChangesAsync();

                return await GetConversationDto(conversation.Id, dto.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining conversation by invite");
                return StatusCode(500, "Помилка при приєднанні до чату");
            }
        }

        /// <summary>
        /// Згенерувати нове посилання-запрошення
        /// </summary>
        [HttpPost("conversations/regenerate-invite")]
        public async Task<ActionResult<ConversationDto>> RegenerateInviteLink([FromBody] RegenerateInviteLinkDto dto)
        {
            try
            {
                var conversation = await _context.Conversations
                    .Include(c => c.Participants)
                    .FirstOrDefaultAsync(c => c.Id == dto.ConversationId);

                if (conversation == null)
                {
                    return NotFound("Розмову не знайдено");
                }

                if (!conversation.IsGroup)
                {
                    return BadRequest("Посилання-запрошення доступні тільки для групових чатів");
                }

                // Перевірка прав (тільки адміни можуть регенерувати посилання)
                var participant = conversation.Participants
                    .FirstOrDefault(p => p.UserId == dto.UserId);

                if (participant == null || participant.Role != "admin")
                {
                    return Forbid("Тільки адміністратори можуть регенерувати посилання");
                }

                conversation.InviteToken = GenerateInviteToken();
                conversation.IsInviteLinkActive = true;
                await _context.SaveChangesAsync();

                return await GetConversationDto(conversation.Id, dto.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error regenerating invite link");
                return StatusCode(500, "Помилка при генерації нового посилання");
            }
        }

        /// <summary>
        /// Увімкнути/вимкнути посилання-запрошення
        /// </summary>
        [HttpPost("conversations/toggle-invite")]
        public async Task<ActionResult<ConversationDto>> ToggleInviteLink([FromBody] ToggleInviteLinkDto dto)
        {
            try
            {
                var conversation = await _context.Conversations
                    .Include(c => c.Participants)
                    .FirstOrDefaultAsync(c => c.Id == dto.ConversationId);

                if (conversation == null)
                {
                    return NotFound("Розмову не знайдено");
                }

                if (!conversation.IsGroup)
                {
                    return BadRequest("Посилання-запрошення доступні тільки для групових чатів");
                }

                // Перевірка прав
                var participant = conversation.Participants
                    .FirstOrDefault(p => p.UserId == dto.UserId);

                if (participant == null || participant.Role != "admin")
                {
                    return Forbid("Тільки адміністратори можуть керувати посиланнями");
                }

                conversation.IsInviteLinkActive = dto.IsActive;
                await _context.SaveChangesAsync();

                return await GetConversationDto(conversation.Id, dto.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling invite link");
                return StatusCode(500, "Помилка при зміні статусу посилання");
            }
        }

        /// <summary>
        /// Отримати інформацію про чат за токеном запрошення
        /// </summary>
        [HttpGet("conversations/invite/{inviteToken}")]
        public async Task<ActionResult<object>> GetConversationByInvite(string inviteToken)
        {
            try
            {
                var conversation = await _context.Conversations
                    .Include(c => c.Participants)
                        .ThenInclude(p => p.User)
                    .FirstOrDefaultAsync(c => c.InviteToken == inviteToken);

                if (conversation == null)
                {
                    return NotFound("Посилання на чат не знайдено");
                }

                if (!conversation.IsInviteLinkActive)
                {
                    return BadRequest("Посилання-запрошення неактивне");
                }

                return Ok(new
                {
                    Id = conversation.Id,
                    Name = conversation.Name,
                    GroupPhotoPath = conversation.GroupPhotoPath,
                    ParticipantCount = conversation.Participants.Count(p => p.IsActive),
                    IsActive = conversation.IsInviteLinkActive
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting conversation by invite");
                return StatusCode(500, "Помилка при отриманні інформації про чат");
            }
        }

        /// <summary>
        /// Генерація унікального токена для запрошення
        /// </summary>
        private string GenerateInviteToken()
        {
            return Guid.NewGuid().ToString("N")[..16]; // 16 символів
        }
    }
}
