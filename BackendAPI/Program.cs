using Microsoft.EntityFrameworkCore;
using BackendAPI.Data;
using BackendAPI.Services;
using BackendAPI.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Додавання сервісів до контейнера
builder.Services.AddControllers();

// Налаштування Entity Framework Core
// Використовуємо SQLite для WSL/Linux, SQL Server для Windows
var usesSqlite = !OperatingSystem.IsWindows();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (usesSqlite)
    {
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
    }
    else
    {
        options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServerConnection") ?? 
                           builder.Configuration.GetConnectionString("DefaultConnection"));
    }
});

// Реєстрація сервісів
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<ISeedDataService, SeedDataService>();

// Додавання SignalR для реального часу
builder.Services.AddSignalR();

// Додавання Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "MyReactNative API",
        Version = "v1",
        Description = "API для реєстрації користувачів у React Native застосунку",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Backend Team",
            Email = "support@example.com"
        }
    });

    // Додавання підтримки XML коментарів (опціонально)
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// Налаштування CORS для React Native та SignalR
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactNativePolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // В режимі розробки дозволяємо всі origins
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            // В production використовуємо конкретні origins
            policy.WithOrigins("http://localhost:8081", "exp://192.168.1.1:8081")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

// Налаштування HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "MyReactNative API V1");
        c.RoutePrefix = string.Empty; // Swagger UI на кореневій сторінці
    });
}

// Створення папки для завантажених файлів
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads", "profiles");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

// HTTPS редірект тільки у production (для React Native потрібен HTTP)
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Сервіс статичних файлів для доступу до завантажених зображень
app.UseStaticFiles();

app.UseCors("ReactNativePolicy");

app.UseAuthorization();

app.MapControllers();

// Мапування SignalR Hub
app.MapHub<ChatHub>("/chathub");

// Міграція бази даних при запуску (тільки для dev)
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            context.Database.Migrate();
            Console.WriteLine("✅ База даних успішно мігрована");

            // Ініціалізація тестових даних
            var seedDataService = services.GetRequiredService<ISeedDataService>();
            await seedDataService.InitializeTestDataAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Помилка при міграції бази даних: {ex.Message}");
        }
    }
}

app.Run();
