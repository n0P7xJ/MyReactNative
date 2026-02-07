namespace BackendAPI.Services
{
    /// <summary>
    /// Сервіс для роботи з файлами
    /// </summary>
    public interface IFileService
    {
        Task<string> SaveProfilePhotoAsync(IFormFile file, string userId);
        Task DeleteFileAsync(string filePath);
        bool IsImageFile(IFormFile file);
    }

    public class FileService : IFileService
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileService> _logger;
        private readonly long _maxFileSizeInBytes;
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif" };

        public FileService(
            IConfiguration configuration,
            IWebHostEnvironment environment,
            ILogger<FileService> logger)
        {
            _configuration = configuration;
            _environment = environment;
            _logger = logger;

            var maxSizeInMB = _configuration.GetValue<int>("FileStorage:MaxFileSizeInMB", 5);
            _maxFileSizeInBytes = maxSizeInMB * 1024 * 1024;
        }

        /// <summary>
        /// Зберігає фото профілю користувача
        /// </summary>
        public async Task<string> SaveProfilePhotoAsync(IFormFile file, string userId)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("Файл відсутній або порожній");
            }

            if (file.Length > _maxFileSizeInBytes)
            {
                throw new ArgumentException($"Розмір файлу перевищує {_maxFileSizeInBytes / (1024 * 1024)} МБ");
            }

            if (!IsImageFile(file))
            {
                throw new ArgumentException("Дозволені тільки файли зображень (jpg, jpeg, png, gif)");
            }

            var uploadPath = _configuration.GetValue<string>("FileStorage:ProfilePhotosPath") ?? "wwwroot/uploads/profiles";
            var fullUploadPath = Path.Combine(_environment.ContentRootPath, uploadPath);

            // Створюємо папку, якщо не існує
            if (!Directory.Exists(fullUploadPath))
            {
                Directory.CreateDirectory(fullUploadPath);
            }

            // Генеруємо унікальне ім'я файлу
            var extension = Path.GetExtension(file.FileName);
            var fileName = $"{userId}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(fullUploadPath, fileName);

            try
            {
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                _logger.LogInformation($"Файл збережено: {filePath}");

                // Повертаємо відносний шлях для збереження в БД
                return $"/uploads/profiles/{fileName}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Помилка при збереженні файлу: {fileName}");
                throw;
            }
        }

        /// <summary>
        /// Видаляє файл
        /// </summary>
        public async Task DeleteFileAsync(string filePath)
        {
            await Task.Run(() =>
            {
                var fullPath = Path.Combine(_environment.WebRootPath, filePath.TrimStart('/'));
                if (File.Exists(fullPath))
                {
                    try
                    {
                        File.Delete(fullPath);
                        _logger.LogInformation($"Файл видалено: {fullPath}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Помилка при видаленні файлу: {fullPath}");
                    }
                }
            });
        }

        /// <summary>
        /// Перевіряє чи є файл зображенням
        /// </summary>
        public bool IsImageFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return false;

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            return _allowedExtensions.Contains(extension);
        }
    }
}
