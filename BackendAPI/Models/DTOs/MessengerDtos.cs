namespace BackendAPI.Models.DTOs
{
    /// <summary>
    /// DTO для створення нової розмови
    /// </summary>
    public class CreateConversationDto
    {
        /// <summary>
        /// ID користувача, який створює розмову
        /// </summary>
        public int CreatedById { get; set; }

        /// <summary>
        /// ID учасників розмови
        /// </summary>
        public List<int> ParticipantIds { get; set; } = new();

        /// <summary>
        /// Назва групового чату (опціонально для групових чатів)
        /// </summary>
        public string? GroupName { get; set; }

        /// <summary>
        /// Чи є це груповим чатом
        /// </summary>
        public bool IsGroup { get; set; } = false;
    }

    /// <summary>
    /// DTO для відправки повідомлення
    /// </summary>
    public class SendMessageDto
    {
        /// <summary>
        /// ID розмови
        /// </summary>
        public int ConversationId { get; set; }

        /// <summary>
        /// ID відправника
        /// </summary>
        public int SenderId { get; set; }

        /// <summary>
        /// Текст повідомлення
        /// </summary>
        public string? Content { get; set; }

        /// <summary>
        /// Тип повідомлення
        /// </summary>
        public string MessageType { get; set; } = "text";

        /// <summary>
        /// ID повідомлення для reply
        /// </summary>
        public int? ReplyToMessageId { get; set; }
    }

    /// <summary>
    /// DTO для відображення розмови
    /// </summary>
    public class ConversationDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public bool IsGroup { get; set; }
        public string? GroupPhotoPath { get; set; }
        public string? InviteToken { get; set; }
        public bool IsInviteLinkActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastMessageAt { get; set; }
        public List<ConversationParticipantDto> Participants { get; set; } = new();
        public MessageDto? LastMessage { get; set; }
        public int UnreadCount { get; set; }
    }

    /// <summary>
    /// DTO для учасника розмови
    /// </summary>
    public class ConversationParticipantDto
    {
        public int UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? ProfilePhotoPath { get; set; }
        public string Role { get; set; } = "member";
        public bool IsActive { get; set; }
    }

    /// <summary>
    /// DTO для повідомлення
    /// </summary>
    public class MessageDto
    {
        public int Id { get; set; }
        public int ConversationId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string? SenderPhoto { get; set; }
        public string? Content { get; set; }
        public string MessageType { get; set; } = "text";
        public string? FilePath { get; set; }
        public string? FileName { get; set; }
        public long? FileSize { get; set; }
        public int? ReplyToMessageId { get; set; }
        public bool IsEdited { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? EditedAt { get; set; }
        public List<ReadStatusDto> ReadStatuses { get; set; } = new();
    }

    /// <summary>
    /// DTO для статусу прочитання
    /// </summary>
    public class ReadStatusDto
    {
        public int UserId { get; set; }
        public DateTime ReadAt { get; set; }
        public bool IsDelivered { get; set; }
    }

    /// <summary>
    /// DTO для приєднання до чату за посиланням
    /// </summary>
    public class JoinByInviteDto
    {
        public int UserId { get; set; }
        public string InviteToken { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO для генерації нового посилання-запрошення
    /// </summary>
    public class RegenerateInviteLinkDto
    {
        public int ConversationId { get; set; }
        public int UserId { get; set; }
    }

    /// <summary>
    /// DTO для перемикання статусу посилання-запрошення
    /// </summary>
    public class ToggleInviteLinkDto
    {
        public int ConversationId { get; set; }
        public int UserId { get; set; }
        public bool IsActive { get; set; }
    }
}
