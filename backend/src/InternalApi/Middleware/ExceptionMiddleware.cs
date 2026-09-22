using System.Diagnostics;
using System.Text.Json;
using ExpenseTracker.Core.Constants;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.InternalApi.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IMessageService messages)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            string traceId = Activity.Current?.Id ?? context.TraceIdentifier;
            _logger.LogError(ex, "Unhandled exception occurred. TraceId: {TraceId}", traceId);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = 500;

            var response = ResponseResult.ServerError(
                AppConstants.MessageCodes.General.ServerError,
                messages.Get(AppConstants.MessageCodes.General.ServerError));
            response.TraceId = traceId;

            string json = JsonSerializer.Serialize(response);
            await context.Response.WriteAsync(json);
        }
    }
}
