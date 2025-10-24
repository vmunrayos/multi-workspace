namespace backend_dotnet.Models;

public static class SessionRoles
{
    public const string User = "user";
    public const string Admin = "admin";
}

public record SessionUser(
    string Id,
    string Name,
    string Role,
    string? PhoneNumber = null,
    string? Email = null
)
{
    public static SessionUser CreateEndUser(string id, string name, string phoneNumber) =>
        new(id, name, SessionRoles.User, PhoneNumber: phoneNumber);

    public static SessionUser CreateAdmin(string id, string name, string email) =>
        new(id, name, SessionRoles.Admin, Email: email);
}
