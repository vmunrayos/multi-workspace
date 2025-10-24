using backend_dotnet.Extensions;
using backend_dotnet.Models;
using Microsoft.AspNetCore.Mvc;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SessionController : ControllerBase
{
    [HttpGet("me")]
    public ActionResult<SessionUser> GetCurrentUser()
    {
        var sessionUser = HttpContext.Session.GetUser();
        if (sessionUser is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        return Ok(sessionUser);
    }
}
