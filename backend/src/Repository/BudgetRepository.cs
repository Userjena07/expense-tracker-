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

public class BudgetRepository : BaseRepository, IBudgetRepository
{
    private readonly ILogger<BudgetRepository> _logger;

    public BudgetRepository(IOptions<ConnectionSettings> connectionSettings, ILogger<BudgetRepository> logger)
        : base(connectionSettings)
    {
        _logger = logger;
    }

    public async Task<ResponseResult> GetAll(long userId, string sessionToken, byte month, short year)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@RequestedBy", userId);
        parameters.Add("@SessionToken", sessionToken);
        parameters.Add("@Month", month);
        parameters.Add("@Year", year);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.GetBudgetList,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Unauthorized(status?.MessageCode ?? AppConstants.MessageCodes.Auth.SessionExpired);
            }

            List<Budget> budgets = (await multi.ReadAsync<Budget>()).AsList();
            return ResponseResult.Ok(budgets, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "BudgetRepository.GetAll failed for UserId: {UserId}", userId);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> Save(Budget budget)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@RequestedBy", budget.RequestedBy);
        parameters.Add("@SessionToken", budget.SessionToken);
        parameters.Add("@CategoryId", budget.CategoryId);
        parameters.Add("@Amount", budget.BudgetAmount);
        parameters.Add("@Month", budget.Month);
        parameters.Add("@Year", budget.Year);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.SaveBudget,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.General.ServerError);
            }

            ResponseResult? listStatus = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            List<Budget> updatedList = (await multi.ReadAsync<Budget>()).AsList();

            return ResponseResult.Ok(updatedList, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "BudgetRepository.Save failed for UserId: {UserId}", budget.RequestedBy);
            return ResponseResult.ServerError();
        }
    }
}
