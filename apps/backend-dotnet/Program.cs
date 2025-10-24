using Microsoft.AspNetCore.Http;

var builder = WebApplication.CreateBuilder(args);

var enforceHttps = builder.Configuration.GetValue<bool>("Security:EnforceHttps", true);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDistributedMemoryCache();

builder.Services.AddSession(options =>
{
    options.Cookie.Name = ".multiworkspace.session";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = enforceHttps ? SameSiteMode.None : SameSiteMode.Lax;
    options.Cookie.SecurePolicy = enforceHttps
        ? CookieSecurePolicy.Always
        : CookieSecurePolicy.None;
    options.Cookie.IsEssential = true;
    options.IdleTimeout = TimeSpan.FromHours(12);
});

var corsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ??
    new[]
    {
        "http://localhost:3000",
        "http://localhost:4200",
        "http://localhost:4300"
    };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AppCors", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (enforceHttps)
{
    app.UseHttpsRedirection();
}

app.UseCors("AppCors");
app.UseSession();

app.MapControllers();

app.Run();
