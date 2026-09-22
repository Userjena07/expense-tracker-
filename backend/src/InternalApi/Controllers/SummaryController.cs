using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.InternalApi.Controllers;

[Authorize]
public class SummaryController : BaseApiController
{
    private readonly ISummaryRepository _summaryRepository;
    private readonly IMessageService _messages;
    private readonly ILogger<SummaryController> _logger;

    public SummaryController(
        ISummaryRepository summaryRepository,
        IMessageService messages,
        ILogger<SummaryController> logger)
    {
        _summaryRepository = summaryRepository;
        _messages = messages;
        _logger = logger;
    }

    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthlySummary([FromQuery] byte month = 0, [FromQuery] short year = 0)
    {
        try
        {
            if (month == 0) month = (byte)DateTime.UtcNow.Month;
            if (year == 0) year = (short)DateTime.UtcNow.Year;

            ResponseResult result = await _summaryRepository.GetMonthlySummary(CurrentUserId, CurrentSessionToken, month, year);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SummaryController.GetMonthlySummary failed for UserId {UserId}, Month {Month}, Year {Year}", CurrentUserId, month, year);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpGet("by-category")]
    public async Task<IActionResult> GetCategorySummary([FromQuery] byte month = 0, [FromQuery] short year = 0, [FromQuery] byte type = 1)
    {
        try
        {
            if (month == 0) month = (byte)DateTime.UtcNow.Month;
            if (year == 0) year = (short)DateTime.UtcNow.Year;

            ResponseResult result = await _summaryRepository.GetCategorySummary(CurrentUserId, CurrentSessionToken, month, year, type);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SummaryController.GetCategorySummary failed for UserId {UserId}, Month {Month}, Year {Year}, Type {Type}", CurrentUserId, month, year, type);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpGet("daily")]
    public async Task<IActionResult> GetDailySummary([FromQuery] byte month = 0, [FromQuery] short year = 0)
    {
        try
        {
            if (month == 0) month = (byte)DateTime.UtcNow.Month;
            if (year == 0) year = (short)DateTime.UtcNow.Year;

            ResponseResult result = await _summaryRepository.GetDailySummary(CurrentUserId, CurrentSessionToken, month, year);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SummaryController.GetDailySummary failed for UserId {UserId}, Month {Month}, Year {Year}", CurrentUserId, month, year);
            return ApiResponse(ResponseResult.ServerError());
        }
    }
}


