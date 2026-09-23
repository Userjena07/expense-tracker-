using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ExpenseTracker.Core.Constants;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Responses;
using ExpenseTracker.Core.Settings;

namespace ExpenseTracker.Repository;

public class TransactionRepository : BaseRepository, ITransactionRepository
{
    private readonly ILogger<TransactionRepository> _logger;

    public TransactionRepository(IOptions<ConnectionSettings> connectionSettings, ILogger<TransactionRepository> logger)
        : base(connectionSettings)
    {
        _logger = logger;
    }

    public async Task<ResponseResult> GetAll(FilterParamInfo filter)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@RequestedBy", filter.RequestedBy);
        parameters.Add("@SessionToken", filter.SessionToken);
        parameters.Add("@FromDate", filter.FromDate);
        parameters.Add("@ToDate", filter.ToDate);
        parameters.Add("@CategoryId", filter.CategoryId);
        parameters.Add("@AccountId", filter.AccountId);
        parameters.Add("@TransactionType", filter.TransactionType);
        parameters.Add("@Keyword", filter.Keyword ?? string.Empty);
        parameters.Add("@PageNo", filter.PageNumber);
        parameters.Add("@PageSize", filter.PageSize);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.GetTransactionList,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Unauthorized(status?.MessageCode ?? AppConstants.MessageCodes.Auth.SessionExpired);
            }

            List<Transaction> transactions = (await multi.ReadAsync<Transaction>()).AsList();
            return ResponseResult.Ok(transactions, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TransactionRepository.GetAll failed for UserId: {UserId}", filter.RequestedBy);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> GetById(long id, long userId, string sessionToken)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@Id", id);
        parameters.Add("@RequestedBy", userId);
        parameters.Add("@SessionToken", sessionToken);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.GetTransactionById,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.Transaction.NotFound);
            }

            Transaction? transaction = await multi.ReadFirstOrDefaultAsync<Transaction>();
            return transaction != null
                ? ResponseResult.Ok(transaction, status.MessageCode)
                : ResponseResult.NotFound(AppConstants.MessageCodes.Transaction.NotFound);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TransactionRepository.GetById failed for Id: {Id}", id);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> Save(Transaction transaction)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@Id", transaction.Id);
        parameters.Add("@RequestedBy", transaction.RequestedBy);
        parameters.Add("@SessionToken", transaction.SessionToken);
        parameters.Add("@AccountId", transaction.AccountId);
        parameters.Add("@CategoryId", transaction.CategoryId);
        parameters.Add("@Amount", transaction.Amount);
        parameters.Add("@TransactionType", (byte)transaction.TransactionType);
        parameters.Add("@TxnDate", transaction.TxnDate);
        parameters.Add("@Note", transaction.Note);
        parameters.Add("@TargetAccountId", transaction.TargetAccountId);
        parameters.Add("@ClientTxnId", transaction.ClientTxnId);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.SaveTransaction,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.General.ServerError);
            }

            ResponseResult? listStatus = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            List<Transaction> updatedList = (await multi.ReadAsync<Transaction>()).AsList();

            return ResponseResult.Ok(updatedList, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TransactionRepository.Save failed for UserId: {UserId}", transaction.RequestedBy);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> Delete(long id, long userId, string sessionToken, int pageNo = 1, int pageSize = 20)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@Id", id);
        parameters.Add("@RequestedBy", userId);
        parameters.Add("@SessionToken", sessionToken);
        parameters.Add("@PageNo", pageNo);
        parameters.Add("@PageSize", pageSize);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.DeleteTransaction,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.General.ServerError);
            }

            ResponseResult? listStatus = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            List<Transaction> updatedList = (await multi.ReadAsync<Transaction>()).AsList();

            return ResponseResult.Ok(updatedList, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TransactionRepository.Delete failed for Id: {Id}", id);
            return ResponseResult.ServerError();
        }
    }
}
