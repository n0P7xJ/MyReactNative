using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Models
{
    /// <summary>
    /// Модель статусу прочитання повідомлення
    /// </summary>
    public class MessageReadStatus
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// ID повідомлення
        /// </summary>
        public int MessageId { get; set; }

        /// <summary>
        /// Повідомлення
        /// </summary>
        public Message? Message { get; set; }

        /// <summary>
        /// ID користувача, який прочитав
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Користувач, який прочитав
        /// </summary>
        public User? User { get; set; }

        /// <summary>
        /// Дата прочитання
        /// </summary>
        public DateTime ReadAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Чи доставлене повідомлення
        /// </summary>
        public bool IsDelivered { get; set; } = true;
    }
}
