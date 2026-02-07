using System.ComponentModel.DataAnnotations;

namespace BackendAPI.Models.DTOs
{
    /// <summary>
    /// DTO для запиту реєстрації користувача
    /// </summary>
    public class RegisterRequestDto
    {
        [Required(ErrorMessage = "Ім'я обов'язкове")]
        [MaxLength(100, ErrorMessage = "Ім'я не може перевищувати 100 символів")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Прізвище обов'язкове")]
        [MaxLength(100, ErrorMessage = "Прізвище не може перевищувати 100 символів")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email обов'язковий")]
        [EmailAddress(ErrorMessage = "Невірний формат email")]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Пароль обов'язковий")]
        [MinLength(6, ErrorMessage = "Пароль має бути мінімум 6 символів")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Телефон обов'язковий")]
        [Phone(ErrorMessage = "Невірний формат телефону")]
        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        /// <summary>
        /// Фото профілю (відправляється як файл через multipart/form-data)
        /// </summary>
        public IFormFile? Photo { get; set; }
    }

    /// <summary>
    /// DTO для відповіді після успішної реєстрації
    /// </summary>
    public class RegisterResponseDto
    {
        public int UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? ProfilePhotoUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Message { get; set; } = "Реєстрація успішна";
    }

    /// <summary>
    /// DTO для запиту входу користувача
    /// </summary>
    public class LoginRequestDto
    {
        [Required(ErrorMessage = "Email обов'язковий")]
        [EmailAddress(ErrorMessage = "Невірний формат email")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Пароль обов'язковий")]
        [MinLength(6, ErrorMessage = "Пароль має бути мінімум 6 символів")]
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO для відповіді після успішної входу
    /// </summary>
    public class LoginResponseDto
    {
        public int UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? ProfilePhotoUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Token { get; set; } = string.Empty; // JWT токен
        public string Message { get; set; } = "Вхід успішний";
    }

    /// <summary>
    /// DTO для відповіді з помилкою
    /// </summary>
    public class ErrorResponseDto
    {
        public string Message { get; set; } = string.Empty;
        public Dictionary<string, string[]>? Errors { get; set; }
    }
}
