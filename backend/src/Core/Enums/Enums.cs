namespace ExpenseTracker.Core.Enums;

public enum ResultStatus
{
    Failure = 0,
    Success = 1
}

public enum AccountType : byte
{
    Cash = 1,
    Bank = 2,
    Card = 3,
    Wallet = 4,
    PocketMoney = 5
}

public enum CategoryType : byte
{
    Expense = 1,
    Income = 2
}

public enum TransactionType : byte
{
    Expense = 1,
    Income = 2,
    Transfer = 3
}

public enum ValidationContext
{
    Register,
    Login,
    RefreshToken,
    UpdateProfile,
    SaveAccount,
    SaveCategory,
    SaveTransaction,
    SaveBudget
}
