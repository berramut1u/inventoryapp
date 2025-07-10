// src/controllers/AuthController.cs
using inventoryapp.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _ctx;
    private readonly string _jwtKey;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;
    private readonly int _jwtExpireMinutes;

    public AuthController(ApplicationDbContext ctx, IConfiguration config)
    {
        _ctx = ctx;

        // Read and validate JWT settings with null-coalescing
        _jwtKey = config["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT Key is not configured (Jwt:Key).");
        _jwtIssuer = config["Jwt:Issuer"]
            ?? throw new InvalidOperationException("JWT Issuer is not configured (Jwt:Issuer).");
        _jwtAudience = config["Jwt:Audience"]
            ?? throw new InvalidOperationException("JWT Audience is not configured (Jwt:Audience).");
        _jwtExpireMinutes = config.GetValue<int?>("Jwt:ExpireMinutes")
            ?? throw new InvalidOperationException("JWT ExpireMinutes is not configured or invalid (Jwt:ExpireMinutes).");
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] User model)
    {
        // TODO: hash the password with BCrypt
        _ctx.Users.Add(model);
        await _ctx.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDto dto)
    {
        var user = _ctx.Users.SingleOrDefault(u => u.Username == dto.Username);
        if (user == null /*|| !BCrypt.Verify(dto.Password, user.PasswordHash)*/)
            return Unauthorized();

        // Safe conversion to bytes
        var keyBytes = Encoding.UTF8.GetBytes(_jwtKey);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
        };

        var creds = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _jwtIssuer,
            audience: _jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtExpireMinutes),
            signingCredentials: creds
        );

        var jwt = new JwtSecurityTokenHandler().WriteToken(token);
        return Ok(new { token = jwt });
    }
}

public class LoginDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}