using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Enums;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.InternalApi.Controllers;

[Authorize]
public class AccountController : BaseApiController
{
    private readonly IAccountRepository _accountRepository;
    private readonly IMessageService _messages;
    private readonly ILogger<AccountController> _logger;

    public AccountController(
        IAccountRepository accountRepository,
        IMessageService messages,
        ILogger<AccountController> logger)
    {
        _accountRepository = accountRepository;
        _messages = messages;
        _logger = logger;
    }

    [HttpPost("list")]
    public async Task<IActionResult> GetList()
    {
        try
        {
            ResponseResult result = await _accountRepository.GetAll(CurrentUserId, CurrentSessionToken);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AccountController.GetList failed for UserId {UserId}", CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpPost("detail")]
    public async Task<IActionResult> GetDetail([FromBody] Account model)
    {
        try
        {
            ResponseResult result = await _accountRepository.GetById(model.Id, CurrentUserId, CurrentSessionToken);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AccountController.GetDetail failed for AccountId {Id}, UserId {UserId}", model.Id, CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpPost("save")]
    public async Task<IActionResult> Save([FromBody] Account model)
    {
        try
        {
            PopulateAuthContext(model);
            string? failCode = model.Validate(ValidationContext.SaveAccount);
            if (failCode is not null)
            {
                return ApiResponse(ResponseResult.Fail(failCode, _messages.Get(failCode)));
            }

            ResponseResult result = await _accountRepository.Save(model);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AccountController.Save failed for Account {Name}, UserId {UserId}", model.Name, CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpPost("delete")]
    public async Task<IActionResult> Delete([FromBody] Account model)
    {
        try
        {
            ResponseResult result = await _accountRepository.Delete(model.Id, CurrentUserId, CurrentSessionToken);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AccountController.Delete failed for AccountId {Id}, UserId {UserId}", model.Id, CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }
}


