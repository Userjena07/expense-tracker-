using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using ExpenseTracker.Core.Constants;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Enums;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Responses;
using ExpenseTracker.Core.Settings;
using ExpenseTracker.InternalApi.Services;

namespace ExpenseTracker.InternalApi.Controllers;

public class AuthController : BaseApiController
{
    private readonly IUserRepository _userRepository;
    private readonly TokenService _tokenService;
    private readonly IMessageService _messages;
    private readonly ILogger<AuthController> _logger;
    private readonly JwtSettings _jwtSettings;

    public AuthController(
        IUserRepository userRepository,
        TokenService tokenService,
        IMessageService messages,
        ILogger<AuthController> logger,
        IOptions<JwtSettings> jwtSettings)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _messages = messages;
        _logger = logger;
        _jwtSettings = jwtSettings.Value;
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] User model)
    {
        try
        {
            string? failCode = model.Validate(ValidationContext.Register);
            if (failCode is not null)
            {
                return ApiResponse(ResponseResult.Fail(failCode, _messages.Get(failCode)));
            }

            model.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password, workFactor: 12);
            model.Password = string.Empty;

            ResponseResult result = await _userRepository.Register(model);
            if (!result.Success || result.Data is not User createdUser)
            {
                result.Message = _messages.Get(result.MessageCode);
                return ApiResponse(result);
            }

            string sessionToken = Guid.NewGuid().ToString();
            string refreshToken = _tokenService.GenerateRefreshToken();
            DateTime expiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);

            await _userRepository.CreateSession(createdUser, sessionToken, refreshToken, expiresAt);

            string accessToken = _tokenService.GenerateAccessToken(createdUser, sessionToken);

            var authResponse = new
            {
                User = createdUser,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresIn = _jwtSettings.ExpiryMinutes * 60
            };

            return ApiResponse(ResponseResult.Ok(authResponse, result.MessageCode, _messages.Get(result.MessageCode)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AuthController.Register failed for Email {Email}", model.Email);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] User model)
    {
        try
        {
            string? failCode = model.Validate(ValidationContext.Login);
            if (failCode is not null)
            {
                return ApiResponse(ResponseResult.Fail(failCode, _messages.Get(failCode)));
            }

            ResponseResult userResult = await _userRepository.GetByEmail(model.Email);
            if (!userResult.Success || userResult.Data is not User user)
            {
                return ApiResponse(ResponseResult.Fail(
                    AppConstants.MessageCodes.Auth.InvalidCredentials,
                    _messages.Get(AppConstants.MessageCodes.Auth.InvalidCredentials),
                    statusCode: 401));
            }

            bool isValidPassword = BCrypt.Net.BCrypt.Verify(model.Password, user.PasswordHash);
            if (!isValidPassword)
            {
                return ApiResponse(ResponseResult.Fail(
                    AppConstants.MessageCodes.Auth.InvalidCredentials,
                    _messages.Get(AppConstants.MessageCodes.Auth.InvalidCredentials),
                    statusCode: 401));
            }

            string sessionToken = Guid.NewGuid().ToString();
            string refreshToken = _tokenService.GenerateRefreshToken();
            DateTime expiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);

            user.DeviceInfo = model.DeviceInfo;
            user.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

            await _userRepository.CreateSession(user, sessionToken, refreshToken, expiresAt);

            string accessToken = _tokenService.GenerateAccessToken(user, sessionToken);
            user.Password = string.Empty;

            var authResponse = new
            {
                User = user,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresIn = _jwtSettings.ExpiryMinutes * 60
            };

            return ApiResponse(ResponseResult.Ok(
                authResponse,
                AppConstants.MessageCodes.Auth.LoginSuccess,
                _messages.Get(AppConstants.MessageCodes.Auth.LoginSuccess)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AuthController.Login failed for Email {Email}", model.Email);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] User model)
    {
        try
        {
            string? failCode = model.Validate(ValidationContext.RefreshToken);
            if (failCode is not null)
            {
                return ApiResponse(ResponseResult.Fail(failCode, _messages.Get(failCode)));
            }

            string newSessionToken = Guid.NewGuid().ToString();
            string newRefreshToken = _tokenService.GenerateRefreshToken();
            DateTime expiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);

            ResponseResult result = await _userRepository.RotateRefreshToken(
                model.RefreshToken,
                newSessionToken,
                newRefreshToken,
                expiresAt);

            if (!result.Success || result.Data is not User user)
            {
                return ApiResponse(ResponseResult.Unauthorized(
                    AppConstants.MessageCodes.Auth.RefreshTokenInvalid,
                    _messages.Get(AppConstants.MessageCodes.Auth.RefreshTokenInvalid)));
            }

            string accessToken = _tokenService.GenerateAccessToken(user, newSessionToken);

            var authResponse = new
            {
                User = user,
                AccessToken = accessToken,
                RefreshToken = newRefreshToken,
                ExpiresIn = _jwtSettings.ExpiryMinutes * 60
            };

            return ApiResponse(ResponseResult.Ok(
                authResponse,
                AppConstants.MessageCodes.Auth.RefreshSuccess,
                _messages.Get(AppConstants.MessageCodes.Auth.RefreshSuccess)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AuthController.Refresh failed");
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        try
        {
            ResponseResult result = await _userRepository.Logout(CurrentUserId, CurrentSessionToken);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AuthController.Logout failed for UserId {UserId}", CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }
}


