using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Enums;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.InternalApi.Controllers;

[Authorize]
public class BudgetController : BaseApiController
{
    private readonly IBudgetRepository _budgetRepository;
    private readonly IMessageService _messages;
    private readonly ILogger<BudgetController> _logger;

    public BudgetController(
        IBudgetRepository budgetRepository,
        IMessageService messages,
        ILogger<BudgetController> logger)
    {
        _budgetRepository = budgetRepository;
        _messages = messages;
        _logger = logger;
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetList([FromQuery] byte month = 0, [FromQuery] short year = 0)
    {
        try
        {
            if (month == 0) month = (byte)DateTime.UtcNow.Month;
            if (year == 0) year = (short)DateTime.UtcNow.Year;

            ResponseResult result = await _budgetRepository.GetAll(CurrentUserId, CurrentSessionToken, month, year);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "BudgetController.GetList failed for UserId {UserId}, Month {Month}, Year {Year}", CurrentUserId, month, year);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpPost("save")]
    public async Task<IActionResult> Save([FromBody] Budget model)
    {
        try
        {
            PopulateAuthContext(model);
            string? failCode = model.Validate(ValidationContext.SaveBudget);
            if (failCode is not null)
            {
                return ApiResponse(ResponseResult.Fail(failCode, _messages.Get(failCode)));
            }

            ResponseResult result = await _budgetRepository.Save(model);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "BudgetController.Save failed for UserId {UserId}", CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }
}


