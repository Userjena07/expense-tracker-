using System.Text.Json.Serialization;
using ExpenseTracker.Core.Constants;
using ExpenseTracker.Core.Enums;

namespace ExpenseTracker.Core.Responses;

public class ResponseResult
{
    public bool Success { get; set; }
    public ResultStatus Status
    {
        get => Success ? ResultStatus.Success : ResultStatus.Failure;
        set => Success = (value == ResultStatus.Success || (int)value == 1);
    }
    public string MessageCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public object? Data { get; set; }
    public string TraceId { get; set; } = string.Empty;
    public int StatusCode { get; set; } = 200;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? RedirectUrl { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? EncryptedData { get; set; }

    public static ResponseResult Ok(object? data = null, string messageCode = AppConstants.MessageCodes.General.Success, string message = "")
    {
        return new ResponseResult
        {
            Success = true,
            StatusCode = 200,
            Data = data,
            MessageCode = messageCode,
            Message = message
        };
    }

    public static ResponseResult Fail(string messageCode = AppConstants.MessageCodes.General.ServerError, string message = "", int statusCode = 400)
    {
        return new ResponseResult
        {
            Success = false,
            StatusCode = statusCode,
            MessageCode = messageCode,
            Message = message
        };
    }

    public static ResponseResult NotFound(string messageCode = AppConstants.MessageCodes.General.NotFound, string message = "")
    {
        return new ResponseResult
        {
            Success = false,
            StatusCode = 404,
            MessageCode = messageCode,
            Message = message
        };
    }

    public static ResponseResult Unauthorized(string messageCode = AppConstants.MessageCodes.Auth.Unauthorized, string message = "")
    {
        return new ResponseResult
        {
            Success = false,
            StatusCode = 401,
            MessageCode = messageCode,
            Message = message
        };
    }

    public static ResponseResult ServerError(string messageCode = AppConstants.MessageCodes.General.ServerError, string message = "")
    {
        return new ResponseResult
        {
            Success = false,
            StatusCode = 500,
            MessageCode = messageCode,
            Message = message
        };
    }
}
