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

public class CategoryRepository : BaseRepository, ICategoryRepository
{
    private readonly ILogger<CategoryRepository> _logger;

    public CategoryRepository(IOptions<ConnectionSettings> connectionSettings, ILogger<CategoryRepository> logger)
        : base(connectionSettings)
    {
        _logger = logger;
    }

    public async Task<ResponseResult> GetAll(long userId, string sessionToken, byte categoryType = 0)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@RequestedBy", userId);
        parameters.Add("@SessionToken", sessionToken);
        parameters.Add("@CategoryType", categoryType);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.GetCategoryList,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Unauthorized(status?.MessageCode ?? AppConstants.MessageCodes.Auth.SessionExpired);
            }

            List<Category> categories = (await multi.ReadAsync<Category>()).AsList();
            return ResponseResult.Ok(categories, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CategoryRepository.GetAll failed for UserId: {UserId}", userId);
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
                AppConstants.Procedures.GetCategoryById,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.Category.NotFound);
            }

            Category? category = await multi.ReadFirstOrDefaultAsync<Category>();
            return category != null
                ? ResponseResult.Ok(category, status.MessageCode)
                : ResponseResult.NotFound(AppConstants.MessageCodes.Category.NotFound);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CategoryRepository.GetById failed for Id: {Id}", id);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> Save(Category category)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@Id", category.Id);
        parameters.Add("@RequestedBy", category.RequestedBy);
        parameters.Add("@SessionToken", category.SessionToken);
        parameters.Add("@Name", category.Name);
        parameters.Add("@Icon", category.Icon);
        parameters.Add("@ColorHex", category.ColorHex);
        parameters.Add("@CategoryType", (byte)category.CategoryType);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.SaveCategory,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.General.ServerError);
            }

            ResponseResult? listStatus = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            List<Category> updatedList = (await multi.ReadAsync<Category>()).AsList();

            return ResponseResult.Ok(updatedList, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CategoryRepository.Save failed for Category: {Name}", category.Name);
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
                AppConstants.Procedures.DeleteCategory,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.General.ServerError);
            }

            ResponseResult? listStatus = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            List<Category> updatedList = (await multi.ReadAsync<Category>()).AsList();

            return ResponseResult.Ok(updatedList, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CategoryRepository.Delete failed for Id: {Id}", id);
            return ResponseResult.ServerError();
        }
    }
}
