using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Models
{
    /// <summary>
    /// Модель розмови (чат)
    /// </summary>
    public class Conversation
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Назва групового чату (якщо null - приватна розмова)
        /// </summary>
        [MaxLength(200)]
        public string? Name { get; set; }

        /// <summary>
        /// Чи є це груповим чатом
        /// </summary>
        public bool IsGroup { get; set; } = false;

        /// <summary>
        /// Шлях до аватару групового чату
        /// </summary>
        public string? GroupPhotoPath { get; set; }

        /// <summary>
        /// ID користувача, який створив розмову
        /// </summary>
        public int CreatedById { get; set; }

        /// <summary>
        /// Користувач, який створив розмову
        /// </summary>
        public User? CreatedBy { get; set; }

        /// <summary>
        /// Дата створення розмови
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Дата останнього повідомлення
        /// </summary>
        public DateTime? LastMessageAt { get; set; }

        /// <summary>
        /// Учасники розмови
        /// </summary>
        public ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();

        /// <summary>
        /// Повідомлення в розмові
        /// </summary>
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
