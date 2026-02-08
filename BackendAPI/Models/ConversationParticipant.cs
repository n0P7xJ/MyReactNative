using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Models
{
    /// <summary>
    /// Модель учасника розмови
    /// </summary>
    public class ConversationParticipant
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// ID розмови
        /// </summary>
        public int ConversationId { get; set; }

        /// <summary>
        /// Розмова
        /// </summary>
        public Conversation? Conversation { get; set; }

        /// <summary>
        /// ID користувача-учасника
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Користувач-учасник
        /// </summary>
        public User? User { get; set; }

        /// <summary>
        /// Роль в груповому чаті (admin, member)
        /// </summary>
        [MaxLength(20)]
        public string Role { get; set; } = "member";

        /// <summary>
        /// Дата приєднання до розмови
        /// </summary>
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Дата виходу з розмови (якщо вийшов)
        /// </summary>
        public DateTime? LeftAt { get; set; }

        /// <summary>
        /// Чи є користувач активним учасником
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Чи вимкнені сповіщення для цієї розмови
        /// </summary>
        public bool IsMuted { get; set; } = false;
    }
}
