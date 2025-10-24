using System.ComponentModel.DataAnnotations;
using backend_dotnet.Extensions;
using backend_dotnet.Models;
using Microsoft.AspNetCore.Mvc;

namespace backend_dotnet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthenticationController : ControllerBase
{
    private const string DemoOtpPhone = "5551234567";
    private const string DemoOtpCode = "246810";

    private const string DemoAdminEmail = "admin@example.com";
    private const string DemoAdminPassword = "SuperSecure123!";

    [HttpPost("login/otp")]
    public ActionResult<LoginResponse> LoginWithOtp([FromBody] OtpLoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        if (!IsValidOtp(request))
        {
            return Unauthorized(new MessageResponse("Invalid phone number or OTP."));
        }

        var sessionUser = SessionUser.CreateEndUser(
            id: "user-001",
            name: "John Doe",
            phoneNumber: request.PhoneNumber);

        HttpContext.Session.SetUser(sessionUser);

        return Ok(new LoginResponse(sessionUser, "OTP login successful."));
    }

    [HttpPost("login/admin")]
    public ActionResult<LoginResponse> LoginAdmin([FromBody] AdminLoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        if (!IsValidAdmin(request))
        {
            return Unauthorized(new MessageResponse("Invalid admin credentials."));
        }

        var sessionUser = SessionUser.CreateAdmin(
            id: "admin-001",
            name: "Admin",
            email: request.Email);

        HttpContext.Session.SetUser(sessionUser);

        return Ok(new LoginResponse(sessionUser, "Admin login successful."));
    }

    [HttpPost("logout")]
    public ActionResult<MessageResponse> Logout()
    {
        HttpContext.Session.ClearUser();
        return Ok(new MessageResponse("Session cleared."));
    }

    private static bool IsValidOtp(OtpLoginRequest request) =>
        string.Equals(request.PhoneNumber, DemoOtpPhone, StringComparison.Ordinal) &&
        string.Equals(request.Otp, DemoOtpCode, StringComparison.Ordinal);

    private static bool IsValidAdmin(AdminLoginRequest request) =>
        string.Equals(request.Email, DemoAdminEmail, StringComparison.OrdinalIgnoreCase) &&
        string.Equals(request.Password, DemoAdminPassword, StringComparison.Ordinal);

    public class OtpLoginRequest
    {
        [Required]
        public string PhoneNumber { get; init; } = string.Empty;

        [Required]
        public string Otp { get; init; } = string.Empty;
    }

    public class AdminLoginRequest
    {
        [Required, EmailAddress]
        public string Email { get; init; } = string.Empty;

        [Required]
        public string Password { get; init; } = string.Empty;
    }

    public record LoginResponse(SessionUser User, string Message);

    public record MessageResponse(string Message);
}
