namespace ExpenseTracker.Core.Constants;

public static class AppConstants
{
    public static class Claims
    {
        public const string UserId = "UserId";
        public const string SessionToken = "SessionToken";
        public const string Email = "Email";
        public const string FullName = "FullName";
    }

    public static class Procedures
    {
        // Auth & User
        public const string RegisterUser = "PRO_RegisterUser";
        public const string GetUserByEmail = "PRO_GetUserByEmail";
        public const string CreateUserSession = "PRO_CreateUserSession";
        public const string ValidateSession = "PRO_ValidateSession";
        public const string RotateRefreshToken = "PRO_RotateRefreshToken";
        public const string LogoutUser = "PRO_LogoutUser";
        public const string GetUserProfile = "PRO_GetUserProfile";
        public const string UpdateUserProfile = "PRO_UpdateUserProfile";

        // Accounts
        public const string GetAccountList = "PRO_GetAccountList";
        public const string GetAccountById = "PRO_GetAccountById";
        public const string SaveAccount = "PRO_SaveAccount";
        public const string DeleteAccount = "PRO_DeleteAccount";

        // Categories
        public const string GetCategoryList = "PRO_GetCategoryList";
        public const string GetCategoryById = "PRO_GetCategoryById";
        public const string SaveCategory = "PRO_SaveCategory";
        public const string DeleteCategory = "PRO_DeleteCategory";

        // Transactions
        public const string GetTransactionList = "PRO_GetTransactionList";
        public const string GetTransactionById = "PRO_GetTransactionById";
        public const string SaveTransaction = "PRO_SaveTransaction";
        public const string DeleteTransaction = "PRO_DeleteTransaction";

        // Budgets
        public const string GetBudgetList = "PRO_GetBudgetList";
        public const string SaveBudget = "PRO_SaveBudget";

        // Summaries & Analytics
        public const string GetMonthlySummary = "PRO_GetMonthlySummary";
        public const string GetCategorySummary = "PRO_GetCategorySummary";
        public const string GetDailySummary = "PRO_GetDailySummary";
    }

    public static class MessageCodes
    {
        public static class General
        {
            public const string Success = "GENERAL_SUCCESS";
            public const string ServerError = "GENERAL_SERVER_ERROR";
            public const string NotFound = "GENERAL_NOT_FOUND";
            public const string ValidationError = "GENERAL_VALIDATION_ERROR";
            public const string RateLimitExceeded = "GENERAL_RATE_LIMIT_EXCEEDED";
        }


        public static class Auth
        {
            public const string RegisterSuccess = "AUTH_REGISTER_SUCCESS";
            public const string LoginSuccess = "AUTH_LOGIN_SUCCESS";
            public const string LogoutSuccess = "AUTH_LOGOUT_SUCCESS";
            public const string InvalidCredentials = "AUTH_INVALID_CREDENTIALS";
            public const string UserNotFound = "AUTH_USER_NOT_FOUND";
            public const string EmailAlreadyExists = "AUTH_EMAIL_ALREADY_EXISTS";
            public const string SessionExpired = "AUTH_SESSION_EXPIRED";
            public const string SessionCreated = "AUTH_SESSION_CREATED";
            public const string RefreshSuccess = "AUTH_REFRESH_SUCCESS";
            public const string RefreshTokenInvalid = "AUTH_REFRESH_TOKEN_INVALID";
            public const string Unauthorized = "AUTH_UNAUTHORIZED";
        }

        public static class User
        {
            public const string ProfileFound = "USER_PROFILE_FOUND";
            public const string ProfileUpdated = "USER_PROFILE_UPDATED";
            public const string NotFound = "USER_NOT_FOUND";
            public const string FullNameRequired = "USER_FULLNAME_REQUIRED";
            public const string EmailRequired = "USER_EMAIL_REQUIRED";
            public const string EmailInvalid = "USER_EMAIL_INVALID";
            public const string PasswordRequired = "USER_PASSWORD_REQUIRED";
            public const string PasswordMinLength = "USER_PASSWORD_MIN_LENGTH";
        }

        public static class Account
        {
            public const string ListSuccess = "ACCOUNT_LIST_SUCCESS";
            public const string Found = "ACCOUNT_FOUND";
            public const string SaveSuccess = "ACCOUNT_SAVE_SUCCESS";
            public const string DeleteSuccess = "ACCOUNT_DELETE_SUCCESS";
            public const string NotFound = "ACCOUNT_NOT_FOUND";
            public const string NameRequired = "ACCOUNT_NAME_REQUIRED";
            public const string InvalidType = "ACCOUNT_INVALID_TYPE";
        }

        public static class Category
        {
            public const string ListSuccess = "CATEGORY_LIST_SUCCESS";
            public const string Found = "CATEGORY_FOUND";
            public const string SaveSuccess = "CATEGORY_SAVE_SUCCESS";
            public const string DeleteSuccess = "CATEGORY_DELETE_SUCCESS";
            public const string NotFound = "CATEGORY_NOT_FOUND";
            public const string NameRequired = "CATEGORY_NAME_REQUIRED";
        }

        public static class Transaction
        {
            public const string ListSuccess = "TRANSACTION_LIST_SUCCESS";
            public const string Found = "TRANSACTION_FOUND";
            public const string SaveSuccess = "TRANSACTION_SAVE_SUCCESS";
            public const string DeleteSuccess = "TRANSACTION_DELETE_SUCCESS";
            public const string NotFound = "TRANSACTION_NOT_FOUND";
            public const string AmountInvalid = "TRANSACTION_AMOUNT_INVALID";
            public const string AccountRequired = "TRANSACTION_ACCOUNT_REQUIRED";
            public const string CategoryRequired = "TRANSACTION_CATEGORY_REQUIRED";
            public const string DateRequired = "TRANSACTION_DATE_REQUIRED";
            public const string InvalidTransferAccount = "TRANSACTION_INVALID_TRANSFER_ACCOUNT";
        }

        public static class Budget
        {
            public const string ListSuccess = "BUDGET_LIST_SUCCESS";
            public const string SaveSuccess = "BUDGET_SAVE_SUCCESS";
            public const string AmountInvalid = "BUDGET_AMOUNT_INVALID";
        }

        public static class Summary
        {
            public const string MonthlySuccess = "SUMMARY_MONTHLY_SUCCESS";
            public const string CategorySuccess = "SUMMARY_CATEGORY_SUCCESS";
            public const string DailySuccess = "SUMMARY_DAILY_SUCCESS";
        }
    }
}
