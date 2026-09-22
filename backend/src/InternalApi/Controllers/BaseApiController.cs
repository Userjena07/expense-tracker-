using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ExpenseTracker.Core.Constants;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.InternalApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("api")]
public abstract class BaseApiController : ControllerBase
{
    protected long CurrentUserId
    {
        get
        {
            string? claim = User.FindFirst(AppConstants.Claims.UserId)?.Value;
            return long.TryParse(claim, out long id) ? id : 0;
        }
    }

    protected string CurrentSessionToken
    {
        get
        {
            return User.FindFirst(AppConstants.Claims.SessionToken)?.Value ?? string.Empty;
        }
    }

    protected void PopulateAuthContext(CommonInfo model)
    {
        model.RequestedBy = CurrentUserId;
        model.UpdatedBy = CurrentUserId;
        model.SessionToken = CurrentSessionToken;
    }

    protected IActionResult ApiResponse(ResponseResult result)
    {
        return StatusCode(result.StatusCode, result);
    }
}
