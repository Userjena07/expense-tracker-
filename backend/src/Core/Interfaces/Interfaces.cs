using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.Core.Interfaces;

public interface IMessageService
{
    string Get(string code);
}

public interface IUserRepository
{
    Task<ResponseResult> Register(User user);
    Task<ResponseResult> GetByEmail(string email);
    Task<ResponseResult> CreateSession(User user, string sessionToken, string refreshToken, DateTime expiresAt);
    Task<ResponseResult> ValidateSession(long userId, string sessionToken);
    Task<ResponseResult> RotateRefreshToken(string oldRefreshToken, string newSessionToken, string newRefreshToken, DateTime expiresAt);
    Task<ResponseResult> Logout(long userId, string sessionToken);
    Task<ResponseResult> GetProfile(long userId, string sessionToken);
    Task<ResponseResult> UpdateProfile(User user);
}

public interface IAccountRepository
{
    Task<ResponseResult> GetAll(long userId, string sessionToken);
    Task<ResponseResult> GetById(long id, long userId, string sessionToken);
    Task<ResponseResult> Save(Account account);
    Task<ResponseResult> Delete(long id, long userId, string sessionToken);
}

public interface ICategoryRepository
{
    Task<ResponseResult> GetAll(long userId, string sessionToken, byte categoryType = 0);
    Task<ResponseResult> GetById(long id, long userId, string sessionToken);
    Task<ResponseResult> Save(Category category);
    Task<ResponseResult> Delete(long id, long userId, string sessionToken);
}

public interface ITransactionRepository
{
    Task<ResponseResult> GetAll(FilterParamInfo filter);
    Task<ResponseResult> GetById(long id, long userId, string sessionToken);
    Task<ResponseResult> Save(Transaction transaction);
    Task<ResponseResult> Delete(long id, long userId, string sessionToken, int pageNo = 1, int pageSize = 20);
}

public interface IBudgetRepository
{
    Task<ResponseResult> GetAll(long userId, string sessionToken, byte month, short year);
    Task<ResponseResult> Save(Budget budget);
}

public interface ISummaryRepository
{
    Task<ResponseResult> GetMonthlySummary(long userId, string sessionToken, byte month, short year);
    Task<ResponseResult> GetCategorySummary(long userId, string sessionToken, byte month, short year, byte transactionType = 1);
    Task<ResponseResult> GetDailySummary(long userId, string sessionToken, byte month, short year);
}
