using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Enums;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.InternalApi.Controllers;

[Authorize]
public class TransactionController : BaseApiController
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IMessageService _messages;
    private readonly ILogger<TransactionController> _logger;

    public TransactionController(
        ITransactionRepository transactionRepository,
        IMessageService messages,
        ILogger<TransactionController> logger)
    {
        _transactionRepository = transactionRepository;
        _messages = messages;
        _logger = logger;
    }

    [HttpPost("list")]
    public async Task<IActionResult> GetList([FromBody] FilterParamInfo filter)
    {
        try
        {
            PopulateAuthContext(filter);
            ResponseResult result = await _transactionRepository.GetAll(filter);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TransactionController.GetList (POST) failed for UserId {UserId}", CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetListGet(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? categoryId,
        [FromQuery] string? accountId,
        [FromQuery] byte type = 0,
        [FromQuery] string? keyword = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var filter = new FilterParamInfo
            {
                FromDate = fromDate,
                ToDate = toDate,
                EncryptedCategoryId = categoryId ?? string.Empty,
                EncryptedAccountId = accountId ?? string.Empty,
                TransactionType = type,
                Keyword = keyword ?? string.Empty,
                PageNumber = page,
                PageSize = pageSize
            };
            PopulateAuthContext(filter);

            ResponseResult result = await _transactionRepository.GetAll(filter);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TransactionController.GetList (GET) failed for UserId {UserId}", CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpPost("detail")]
    public async Task<IActionResult> GetDetail([FromBody] Transaction model)
    {
        try
        {
            ResponseResult result = await _transactionRepository.GetById(model.Id, CurrentUserId, CurrentSessionToken);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TransactionController.GetDetail failed for TxnId {Id}, UserId {UserId}", model.Id, CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpPost("save")]
    public async Task<IActionResult> Save([FromBody] Transaction model)
    {
        try
        {
            PopulateAuthContext(model);
            string? failCode = model.Validate(ValidationContext.SaveTransaction);
            if (failCode is not null)
            {
                return ApiResponse(ResponseResult.Fail(failCode, _messages.Get(failCode)));
            }

            ResponseResult result = await _transactionRepository.Save(model);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TransactionController.Save failed for UserId {UserId}", CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpPost("delete")]
    public async Task<IActionResult> Delete([FromBody] Transaction model)
    {
        try
        {
            ResponseResult result = await _transactionRepository.Delete(model.Id, CurrentUserId, CurrentSessionToken);
            result.Message = _messages.Get(result.MessageCode);
            return ApiResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TransactionController.Delete failed for TxnId {Id}, UserId {UserId}", model.Id, CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }

    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        try
        {
            var filter = new FilterParamInfo
            {
                FromDate = fromDate,
                ToDate = toDate,
                PageNumber = 1,
                PageSize = 10000
            };
            PopulateAuthContext(filter);

            ResponseResult result = await _transactionRepository.GetAll(filter);
            if (!result.Success || result.Data is not List<Transaction> transactions)
            {
                return BadRequest(result);
            }

            var sb = new StringBuilder();
            sb.AppendLine("Date,Type,Category,Account,Amount,Note");

            foreach (var txn in transactions)
            {
                string typeStr = txn.TransactionType switch
                {
                    TransactionType.Income => "Income",
                    TransactionType.Transfer => "Transfer",
                    _ => "Expense"
                };
                string escapedNote = (txn.Note ?? "").Replace("\"", "\"\"");
                sb.AppendLine($"{txn.TxnDate:yyyy-MM-dd},{typeStr},\"{txn.CategoryName}\",\"{txn.AccountName}\",{txn.Amount},\"{escapedNote}\"");
            }

            byte[] bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"transactions_{DateTime.UtcNow:yyyyMMdd}.csv");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TransactionController.ExportCsv failed for UserId {UserId}", CurrentUserId);
            return ApiResponse(ResponseResult.ServerError());
        }
    }
}


