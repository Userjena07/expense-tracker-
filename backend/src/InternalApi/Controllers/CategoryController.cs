using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Enums;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.InternalApi.Controllers;

[Authorize]
public class CategoryController : BaseApiController
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IMessageService _messages;
    private readonly ILogger<CategoryController> _logger;

    public CategoryController(
        ICategoryRepository categoryRepository,
        IMessageService messages,
        ILogger<CategoryController> logger)
    {
        _categoryRepository = categoryRepository;
        _messages = messages;
        _logger = logger;
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetList([FromQuery] byte categoryType = 0)
    {
        try
        {
            ResponseResult result = await _categoryRepository.GetAll(CurrentUserId, CurrentSessionToken, categoryType);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CategoryController.GetList failed for UserId {UserId}, CategoryType {CategoryType}", CurrentUserId, categoryType);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpPost("detail")]
    public async Task<IActionResult> GetDetail([FromBody] Category model)
    {
        try
        {
            ResponseResult result = await _categoryRepository.GetById(model.Id, CurrentUserId, CurrentSessionToken);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CategoryController.GetDetail failed for CategoryId {Id}, UserId {UserId}", model.Id, CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpPost("save")]
    public async Task<IActionResult> Save([FromBody] Category model)
    {
        try
        {
            PopulateAuthContext(model);
            string? failCode = model.Validate(ValidationContext.SaveCategory);
            if (failCode is not null)
            {
                return ApiResponse(ResponseResult.Fail(failCode, _messages.Get(failCode)));
            }

            ResponseResult result = await _categoryRepository.Save(model);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CategoryController.Save failed for Category {Name}, UserId {UserId}", model.Name, CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpPost("delete")]
    public async Task<IActionResult> Delete([FromBody] Category model)
    {
        try
        {
            ResponseResult result = await _categoryRepository.Delete(model.Id, CurrentUserId, CurrentSessionToken);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CategoryController.Delete failed for CategoryId {Id}, UserId {UserId}", model.Id, CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }
}


