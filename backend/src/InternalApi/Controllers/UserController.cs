using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Enums;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.InternalApi.Controllers;

[Authorize]
public class UserController : BaseApiController
{
    private readonly IUserRepository _userRepository;
    private readonly IMessageService _messages;
    private readonly ILogger<UserController> _logger;

    public UserController(
        IUserRepository userRepository,
        IMessageService messages,
        ILogger<UserController> logger)
    {
        _userRepository = userRepository;
        _messages = messages;
        _logger = logger;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            ResponseResult result = await _userRepository.GetProfile(CurrentUserId, CurrentSessionToken);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UserController.GetProfile failed for UserId {UserId}", CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpPost("update-profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] User model)
    {
        try
        {
            PopulateAuthContext(model);
            string? failCode = model.Validate(ValidationContext.UpdateProfile);
            if (failCode is not null)
            {
                return ApiResponse(ResponseResult.Fail(failCode, _messages.Get(failCode)));
            }

            ResponseResult result = await _userRepository.UpdateProfile(model);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UserController.UpdateProfile failed for UserId {UserId}", CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }
}


