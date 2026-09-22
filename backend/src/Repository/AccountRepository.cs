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

public class AccountRepository : BaseRepository, IAccountRepository
{
    private readonly ILogger<AccountRepository> _logger;

    public AccountRepository(IOptions<ConnectionSettings> connectionSettings, ILogger<AccountRepository> logger)
        : base(connectionSettings)
    {
        _logger = logger;
    }

    public async Task<ResponseResult> GetAll(long userId, string sessionToken)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@RequestedBy", userId);
        parameters.Add("@SessionToken", sessionToken);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.GetAccountList,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Unauthorized(status?.MessageCode ?? AppConstants.MessageCodes.Auth.SessionExpired);
            }

            List<Account> accounts = (await multi.ReadAsync<Account>()).AsList();
            return ResponseResult.Ok(accounts, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AccountRepository.GetAll failed for UserId: {UserId}", userId);
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
                AppConstants.Procedures.GetAccountById,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.Account.NotFound);
            }

            Account? account = await multi.ReadFirstOrDefaultAsync<Account>();
            return account != null
                ? ResponseResult.Ok(account, status.MessageCode)
                : ResponseResult.NotFound(AppConstants.MessageCodes.Account.NotFound);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AccountRepository.GetById failed for Id: {Id}", id);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> Save(Account account)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@Id", account.Id);
        parameters.Add("@RequestedBy", account.RequestedBy);
        parameters.Add("@SessionToken", account.SessionToken);
        parameters.Add("@Name", account.Name);
        parameters.Add("@AccountType", (byte)account.AccountType);
        parameters.Add("@OpeningBalance", account.OpeningBalance);
        parameters.Add("@ColorHex", account.ColorHex);
        parameters.Add("@Icon", account.Icon);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.SaveAccount,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.General.ServerError);
            }

            // R23: Second result set is the updated list
            ResponseResult? listStatus = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            List<Account> updatedList = (await multi.ReadAsync<Account>()).AsList();

            return ResponseResult.Ok(updatedList, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AccountRepository.Save failed for Account: {Name}", account.Name);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> Delete(long id, long userId, string sessionToken)
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
                AppConstants.Procedures.DeleteAccount,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.General.ServerError);
            }

            ResponseResult? listStatus = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            List<Account> updatedList = (await multi.ReadAsync<Account>()).AsList();

            return ResponseResult.Ok(updatedList, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AccountRepository.Delete failed for Id: {Id}", id);
            return ResponseResult.ServerError();
        }
    }
}
