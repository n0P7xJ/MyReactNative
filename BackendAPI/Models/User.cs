using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendAPI.Models
{
    /// <summary>
    /// Модель користувача в системі
    /// </summary>
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [Phone]
        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        /// <summary>
        /// Шлях до фото профілю
        /// </summary>
        public string? ProfilePhotoPath { get; set; }

        /// <summary>
        /// Дата створення акаунту
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Дата останнього оновлення
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Чи активний користувач
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Повне ім'я користувача
        /// </summary>
        [NotMapped]
        public string FullName => $"{FirstName} {LastName}";
    }
}
