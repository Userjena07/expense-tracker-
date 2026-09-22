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

public class SummaryRepository : BaseRepository, ISummaryRepository
{
    private readonly ILogger<SummaryRepository> _logger;

    public SummaryRepository(IOptions<ConnectionSettings> connectionSettings, ILogger<SummaryRepository> logger)
        : base(connectionSettings)
    {
        _logger = logger;
    }

    public async Task<ResponseResult> GetMonthlySummary(long userId, string sessionToken, byte month, short year)
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
                AppConstants.Procedures.GetMonthlySummary,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Unauthorized(status?.MessageCode ?? AppConstants.MessageCodes.Auth.SessionExpired);
            }

            MonthlySummary? summary = await multi.ReadFirstOrDefaultAsync<MonthlySummary>();
            return ResponseResult.Ok(summary, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SummaryRepository.GetMonthlySummary failed for UserId: {UserId}", userId);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> GetCategorySummary(long userId, string sessionToken, byte month, short year, byte transactionType = 1)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@RequestedBy", userId);
        parameters.Add("@SessionToken", sessionToken);
        parameters.Add("@Month", month);
        parameters.Add("@Year", year);
        parameters.Add("@TransactionType", transactionType);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.GetCategorySummary,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Unauthorized(status?.MessageCode ?? AppConstants.MessageCodes.Auth.SessionExpired);
            }

            List<CategorySummary> categorySummaries = (await multi.ReadAsync<CategorySummary>()).AsList();
            return ResponseResult.Ok(categorySummaries, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SummaryRepository.GetCategorySummary failed for UserId: {UserId}", userId);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> GetDailySummary(long userId, string sessionToken, byte month, short year)
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
                AppConstants.Procedures.GetDailySummary,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Unauthorized(status?.MessageCode ?? AppConstants.MessageCodes.Auth.SessionExpired);
            }

            List<DailySummary> dailySummaries = (await multi.ReadAsync<DailySummary>()).AsList();
            return ResponseResult.Ok(dailySummaries, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SummaryRepository.GetDailySummary failed for UserId: {UserId}", userId);
            return ResponseResult.ServerError();
        }
    }
}
