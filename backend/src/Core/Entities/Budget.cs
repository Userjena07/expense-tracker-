using ExpenseTracker.Core.Constants;
using ExpenseTracker.Core.Enums;
using ExpenseTracker.Core.Helpers;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.Core.Entities;

public class Budget : CommonInfo
{
    public long UserId { get; set; }

    public long? CategoryId { get; set; }
    public string? EncryptedCategoryId
    {
        get => CategoryId.HasValue && CategoryId.Value > 0 ? EncryptionHelper.EncryptId(CategoryId.Value) : string.Empty;
        set
        {
            if (EncryptionHelper.TryDecryptId(value, out long decryptedId))
            {
                CategoryId = decryptedId;
            }
            else
            {
                CategoryId = null;
            }
        }
    }
    public string? CategoryName { get; set; }
    public string? CategoryIcon { get; set; }
    public string? CategoryColorHex { get; set; }

    public decimal BudgetAmount { get; set; }
    public decimal SpentAmount { get; set; }
    public byte Month { get; set; }
    public short Year { get; set; }

    public string? Validate(ValidationContext context)
    {
        if (context == ValidationContext.SaveBudget)
        {
            if (BudgetAmount <= 0)
            {
                return AppConstants.MessageCodes.Budget.AmountInvalid;
            }
            if (Month < 1 || Month > 12)
            {
                Month = (byte)DateTime.UtcNow.Month;
            }
            if (Year < 2000 || Year > 2100)
            {
                Year = (short)DateTime.UtcNow.Year;
            }
        }

        return null;
    }
}

