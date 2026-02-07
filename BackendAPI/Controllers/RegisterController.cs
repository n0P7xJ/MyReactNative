using Microsoft.AspNetCore.Mvc;
using BackendAPI.Models.DTOs;
using BackendAPI.Services;

namespace BackendAPI.Controllers
{
    /// <summary>
    /// Контролер для реєстрації користувачів
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class RegisterController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<RegisterController> _logger;

        public RegisterController(
            IUserService userService,
            ILogger<RegisterController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        /// <summary>
        /// Реєструє нового користувача
        /// </summary>
        /// <param name="request">Дані для реєстрації</param>
        /// <returns>Інформація про зареєстрованого користувача</returns>
        /// <response code="201">Користувач успішно зареєстрований</response>
        /// <response code="400">Невалідні дані або користувач вже існує</response>
        /// <response code="500">Серверна помилка</response>
        [HttpPost]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(RegisterResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Register([FromForm] RegisterRequestDto request)
        {
            try
            {
                // Валідація моделі
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                        );

                    return BadRequest(new ErrorResponseDto
                    {
                        Message = "Помилка валідації",
                        Errors = errors
                    });
                }

                // Виклик сервісу реєстрації
                var response = await _userService.RegisterUserAsync(request);

                _logger.LogInformation($"Користувач успішно зареєстрований: {response.Email}");

                return CreatedAtAction(
                    nameof(GetUser),
                    new { id = response.UserId },
                    response
                );
            }
            catch (InvalidOperationException ex)
            {
                // Користувач вже існує
                _logger.LogWarning(ex.Message);
                return BadRequest(new ErrorResponseDto
                {
                    Message = ex.Message
                });
            }
            catch (ArgumentException ex)
            {
                // Помилка валідації файлу
                _logger.LogWarning(ex.Message);
                return BadRequest(new ErrorResponseDto
                {
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                // Загальна помилка
                _logger.LogError(ex, "Помилка при реєстрації користувача");
                return StatusCode(500, new ErrorResponseDto
                {
                    Message = "Виникла помилка при реєстрації. Спробуйте пізніше."
                });
            }
        }

        /// <summary>
        /// Отримує інформацію про користувача за ID
        /// </summary>
        /// <param name="id">ID користувача</param>
        /// <returns>Інформація про користувача</returns>
        /// <response code="200">Користувач знайдений</response>
        /// <response code="404">Користувач не знайдений</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(RegisterResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUser(int id)
        {
            try
            {
                var user = await _userService.GetUserByIdAsync(id);

                if (user == null)
                {
                    return NotFound(new ErrorResponseDto
                    {
                        Message = "Користувача не знайдено"
                    });
                }

                var response = new RegisterResponseDto
                {
                    UserId = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    Phone = user.Phone,
                    ProfilePhotoUrl = user.ProfilePhotoPath,
                    CreatedAt = user.CreatedAt
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Помилка при отриманні користувача {id}");
                return StatusCode(500, new ErrorResponseDto
                {
                    Message = "Виникла помилка при отриманні даних користувача"
                });
            }
        }

        /// <summary>
        /// Перевіряє чи зайнятий email
        /// </summary>
        /// <param name="email">Email для перевірки</param>
        /// <returns>True якщо email зайнятий</returns>
        /// <response code="200">Результат перевірки</response>
        [HttpGet("check-email")]
        [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
        public async Task<IActionResult> CheckEmail([FromQuery] string email)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                {
                    return BadRequest(new ErrorResponseDto
                    {
                        Message = "Email не може бути порожнім"
                    });
                }

                var exists = await _userService.IsEmailExistsAsync(email);
                return Ok(new { exists });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Помилка при перевірці email: {email}");
                return StatusCode(500, new ErrorResponseDto
                {
                    Message = "Виникла помилка при перевірці email"
                });
            }
        }
    }
}
