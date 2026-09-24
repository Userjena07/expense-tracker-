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

public class UserRepository : BaseRepository, IUserRepository
{
    private readonly ILogger<UserRepository> _logger;

    public UserRepository(IOptions<ConnectionSettings> connectionSettings, ILogger<UserRepository> logger)
        : base(connectionSettings)
    {
        _logger = logger;
    }

    public async Task<ResponseResult> Register(User user)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@FullName", user.FullName);
        parameters.Add("@Email", user.Email);
        parameters.Add("@PasswordHash", user.PasswordHash);
        parameters.Add("@CurrencyCode", user.CurrencyCode);
        parameters.Add("@MonthStartDay", user.MonthStartDay);
        parameters.Add("@Theme", user.Theme);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.RegisterUser,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.General.ServerError);
            }

            User? createdUser = await multi.ReadFirstOrDefaultAsync<User>();
            return ResponseResult.Ok(createdUser, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UserRepository.Register failed for email: {Email}", user.Email);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> GetByEmail(string email)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@Email", email);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.GetUserByEmail,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.Auth.UserNotFound);
            }

            User? user = await multi.ReadFirstOrDefaultAsync<User>();
            return user != null
                ? ResponseResult.Ok(user, status.MessageCode)
                : ResponseResult.NotFound(AppConstants.MessageCodes.Auth.UserNotFound);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UserRepository.GetByEmail failed for email: {Email}", email);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> CreateSession(User user, string sessionToken, string refreshToken, DateTime expiresAt)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@UserId", user.Id);
        parameters.Add("@SessionToken", sessionToken);
        parameters.Add("@RefreshToken", refreshToken);
        parameters.Add("@DeviceInfo", user.DeviceInfo);
        parameters.Add("@IpAddress", user.IpAddress);
        parameters.Add("@ExpiresAt", expiresAt);

        try
        {
            ResponseResult? status = await conn.QueryFirstOrDefaultAsync<ResponseResult>(
                AppConstants.Procedures.CreateUserSession,
                parameters,
                commandType: CommandType.StoredProcedure);

            return status is not null && status.Success
                ? ResponseResult.Ok(null, status.MessageCode)
                : ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.General.ServerError);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UserRepository.CreateSession failed for UserId: {UserId}", user.Id);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> ValidateSession(long userId, string sessionToken)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@RequestedBy", userId);
        parameters.Add("@SessionToken", sessionToken);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.ValidateSession,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Unauthorized(status?.MessageCode ?? AppConstants.MessageCodes.Auth.SessionExpired);
            }

            User? user = await multi.ReadFirstOrDefaultAsync<User>();
            return ResponseResult.Ok(user, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UserRepository.ValidateSession failed for UserId: {UserId}", userId);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> RotateRefreshToken(string oldRefreshToken, string newSessionToken, string newRefreshToken, DateTime expiresAt)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@OldRefreshToken", oldRefreshToken);
        parameters.Add("@NewSessionToken", newSessionToken);
        parameters.Add("@NewRefreshToken", newRefreshToken);
        parameters.Add("@ExpiresAt", expiresAt);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.RotateRefreshToken,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Unauthorized(status?.MessageCode ?? AppConstants.MessageCodes.Auth.RefreshTokenInvalid);
            }

            User? user = await multi.ReadFirstOrDefaultAsync<User>();
            return ResponseResult.Ok(user, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UserRepository.RotateRefreshToken failed");
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> Logout(long userId, string sessionToken)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@RequestedBy", userId);
        parameters.Add("@SessionToken", sessionToken);

        try
        {
            ResponseResult? status = await conn.QueryFirstOrDefaultAsync<ResponseResult>(
                AppConstants.Procedures.LogoutUser,
                parameters,
                commandType: CommandType.StoredProcedure);

            return status is not null && status.Success
                ? ResponseResult.Ok(null, status.MessageCode)
                : ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.General.ServerError);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UserRepository.Logout failed for UserId: {UserId}", userId);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> GetProfile(long userId, string sessionToken)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@RequestedBy", userId);
        parameters.Add("@SessionToken", sessionToken);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.GetUserProfile,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Unauthorized(status?.MessageCode ?? AppConstants.MessageCodes.Auth.SessionExpired);
            }

            User? user = await multi.ReadFirstOrDefaultAsync<User>();
            return user != null
                ? ResponseResult.Ok(user, status.MessageCode)
                : ResponseResult.NotFound(AppConstants.MessageCodes.User.NotFound);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UserRepository.GetProfile failed for UserId: {UserId}", userId);
            return ResponseResult.ServerError();
        }
    }

    public async Task<ResponseResult> UpdateProfile(User user)
    {
        await using SqlConnection conn = CreateConnection();
        await conn.OpenAsync();

        var parameters = new DynamicParameters();
        parameters.Add("@RequestedBy", user.RequestedBy);
        parameters.Add("@SessionToken", user.SessionToken);
        parameters.Add("@FullName", string.IsNullOrWhiteSpace(user.FullName) ? null : user.FullName);
        parameters.Add("@CurrencyCode", string.IsNullOrWhiteSpace(user.CurrencyCode) ? null : user.CurrencyCode);
        parameters.Add("@MonthStartDay", user.MonthStartDay == 0 ? null : (byte?)user.MonthStartDay);
        parameters.Add("@Theme", string.IsNullOrWhiteSpace(user.Theme) ? null : user.Theme);
        parameters.Add("@IsBiometricOn", user.IsBiometricOn);

        try
        {
            using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
                AppConstants.Procedures.UpdateUserProfile,
                parameters,
                commandType: CommandType.StoredProcedure);

            ResponseResult? status = await multi.ReadFirstOrDefaultAsync<ResponseResult>();
            if (status is null || !status.Success)
            {
                return ResponseResult.Fail(status?.MessageCode ?? AppConstants.MessageCodes.General.ServerError);
            }

            User? updatedUser = await multi.ReadFirstOrDefaultAsync<User>();
            return ResponseResult.Ok(updatedUser, status.MessageCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UserRepository.UpdateProfile failed for UserId: {UserId}", user.RequestedBy);
            return ResponseResult.ServerError();
        }
    }
}
