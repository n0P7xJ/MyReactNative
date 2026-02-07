using Microsoft.EntityFrameworkCore;
using BackendAPI.Data;
using BackendAPI.Models;
using BackendAPI.Models.DTOs;

namespace BackendAPI.Services
{
    /// <summary>
    /// Сервіс для роботи з користувачами
    /// </summary>
    public interface IUserService
    {
        Task<RegisterResponseDto> RegisterUserAsync(RegisterRequestDto request);
        Task<LoginResponseDto> LoginUserAsync(string email, string password);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByIdAsync(int id);
        Task<bool> IsEmailExistsAsync(string email);
    }

    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileService _fileService;
        private readonly ILogger<UserService> _logger;

        public UserService(
            ApplicationDbContext context,
            IFileService fileService,
            ILogger<UserService> logger)
        {
            _context = context;
            _fileService = fileService;
            _logger = logger;
        }

        /// <summary>
        /// Реєструє нового користувача
        /// </summary>
        public async Task<RegisterResponseDto> RegisterUserAsync(RegisterRequestDto request)
        {
            // Перевірка чи існує користувач з таким email
            if (await IsEmailExistsAsync(request.Email))
            {
                throw new InvalidOperationException("Користувач з таким email вже існує");
            }

            // Хешування пароля
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Створення нового користувача
            var user = new User
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = request.Email.Trim().ToLowerInvariant(),
                PasswordHash = passwordHash,
                Phone = request.Phone.Trim(),
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            // Додаємо користувача до БД
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Зберігаємо фото профілю, якщо воно надано
            string? photoUrl = null;
            if (request.Photo != null)
            {
                try
                {
                    var photoPath = await _fileService.SaveProfilePhotoAsync(request.Photo, user.Id.ToString());
                    user.ProfilePhotoPath = photoPath;
                    photoUrl = photoPath;

                    _context.Users.Update(user);
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Помилка при збереженні фото для користувача {user.Id}");
                    // Продовжуємо без фото
                }
            }

            _logger.LogInformation($"Новий користувач зареєстрований: {user.Email} (ID: {user.Id})");

            return new RegisterResponseDto
            {
                UserId = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Phone = user.Phone,
                ProfilePhotoUrl = photoUrl,
                CreatedAt = user.CreatedAt,
                Message = "Реєстрація успішна"
            };
        }

        /// <summary>
        /// Отримує користувача за email
        /// </summary>
        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant());
        }

        /// <summary>
        /// Отримує користувача за ID
        /// </summary>
        public async Task<User?> GetUserByIdAsync(int id)
        {
            return await _context.Users.FindAsync(id);
        }

        /// <summary>
        /// Перевіряє чи існує користувач з таким email
        /// </summary>
        public async Task<bool> IsEmailExistsAsync(string email)
        {
            return await _context.Users
                .AnyAsync(u => u.Email == email.ToLowerInvariant());
        }

        /// <summary>
        /// Вхід користувача
        /// </summary>
        public async Task<LoginResponseDto> LoginUserAsync(string email, string password)
        {
            var user = await GetUserByEmailAsync(email);

            if (user == null)
            {
                throw new UnauthorizedAccessException("Користувач не знайдений");
            }

            // Перевірка пароля
            var isPasswordValid = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
            if (!isPasswordValid)
            {
                throw new UnauthorizedAccessException("Невірний пароль");
            }

            if (!user.IsActive)
            {
                throw new UnauthorizedAccessException("Обліковий запис деактивований");
            }

            _logger.LogInformation($"Користувач увійшов: {user.Email}");

            return new LoginResponseDto
            {
                UserId = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Phone = user.Phone,
                ProfilePhotoUrl = user.ProfilePhotoPath,
                CreatedAt = user.CreatedAt,
                Token = "dummy_token_" + user.Id, // Для тестування, потім буде JWT
                Message = "Вхід успішний"
            };
        }
    }
}
