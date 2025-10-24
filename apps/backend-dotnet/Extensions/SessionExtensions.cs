using System.Text.Json;
using backend_dotnet.Models;
using Microsoft.AspNetCore.Http;

namespace backend_dotnet.Extensions;

public static class SessionExtensions
{
    private const string UserKey = "session-user";

    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public static void SetUser(this ISession session, SessionUser user)
    {
        var json = JsonSerializer.Serialize(user, SerializerOptions);
        session.SetString(UserKey, json);
    }

    public static SessionUser? GetUser(this ISession session)
    {
        var json = session.GetString(UserKey);
        return json is null ? null : JsonSerializer.Deserialize<SessionUser>(json, SerializerOptions);
    }

    public static void ClearUser(this ISession session)
    {
        session.Remove(UserKey);
    }
}
