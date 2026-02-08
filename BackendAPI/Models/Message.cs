using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Models
{
    /// <summary>
    /// Модель повідомлення
    /// </summary>
    public class Message
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// ID розмови
        /// </summary>
        public int ConversationId { get; set; }

        /// <summary>
        /// Розмова, до якої належить повідомлення
        /// </summary>
        public Conversation? Conversation { get; set; }

        /// <summary>
        /// ID відправника
        /// </summary>
        public int SenderId { get; set; }

        /// <summary>
        /// Відправник повідомлення
        /// </summary>
        public User? Sender { get; set; }

        /// <summary>
        /// Текст повідомлення
        /// </summary>
        [MaxLength(5000)]
        public string? Content { get; set; }

        /// <summary>
        /// Тип повідомлення (text, image, file, audio, video)
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string MessageType { get; set; } = "text";

        /// <summary>
        /// Шлях до файлу (для повідомлень з медіа)
        /// </summary>
        public string? FilePath { get; set; }

        /// <summary>
        /// Назва файлу
        /// </summary>
        [MaxLength(255)]
        public string? FileName { get; set; }

        /// <summary>
        /// Розмір файлу в байтах
        /// </summary>
        public long? FileSize { get; set; }

        /// <summary>
        /// ID повідомлення, на яке відповідають (для reply)
        /// </summary>
        public int? ReplyToMessageId { get; set; }

        /// <summary>
        /// Повідомлення, на яке відповідають
        /// </summary>
        public Message? ReplyToMessage { get; set; }

        /// <summary>
        /// Чи відредаговане повідомлення
        /// </summary>
        public bool IsEdited { get; set; } = false;

        /// <summary>
        /// Чи видалене повідомлення
        /// </summary>
        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// Дата створення повідомлення
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Дата редагування повідомлення
        /// </summary>
        public DateTime? EditedAt { get; set; }

        /// <summary>
        /// Статуси прочитання повідомлення
        /// </summary>
        public ICollection<MessageReadStatus> ReadStatuses { get; set; } = new List<MessageReadStatus>();
    }
}
