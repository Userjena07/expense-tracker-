namespace ExpenseTracker.Core.Entities;

public class MonthlySummary
{
    public byte Month { get; set; }
    public short Year { get; set; }
    public DateTime CycleStartDate { get; set; }
    public DateTime CycleEndDate { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal NetSavings { get; set; }
    public decimal TotalAccountBalance { get; set; }
    public decimal TotalBudget { get; set; }
    public decimal BudgetRemaining { get; set; }
    public int DaysRemainingInCycle { get; set; }
    public decimal SafeToSpendToday { get; set; }
}

public class CategorySummary
{
    public long CategoryId { get; set; }
    public string EncryptedCategoryId => CategoryId > 0 ? Helpers.EncryptionHelper.EncryptId(CategoryId) : string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryIcon { get; set; } = string.Empty;
    public string CategoryColorHex { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int TransactionCount { get; set; }
    public decimal Percentage { get; set; }
}

public class DailySummary
{
    public DateTime TxnDate { get; set; }
    public decimal ExpenseTotal { get; set; }
    public decimal IncomeTotal { get; set; }
    public int TransactionCount { get; set; }
}
