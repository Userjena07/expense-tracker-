using ExpenseTracker.Core.Constants;
using ExpenseTracker.Core.Enums;
using ExpenseTracker.Core.Helpers;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.Core.Entities;

public class Transaction : CommonInfo
{
    public long UserId { get; set; }

    public long AccountId { get; set; }
    public string EncryptedAccountId
    {
        get => AccountId > 0 ? EncryptionHelper.EncryptId(AccountId) : string.Empty;
        set
        {
            if (EncryptionHelper.TryDecryptId(value, out long decryptedId))
            {
                AccountId = decryptedId;
            }
        }
    }
    public string AccountName { get; set; } = string.Empty;
    public string AccountColorHex { get; set; } = string.Empty;

    public long CategoryId { get; set; }
    public string EncryptedCategoryId
    {
        get => CategoryId > 0 ? EncryptionHelper.EncryptId(CategoryId) : string.Empty;
        set
        {
            if (EncryptionHelper.TryDecryptId(value, out long decryptedId))
            {
                CategoryId = decryptedId;
            }
        }
    }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryIcon { get; set; } = string.Empty;
    public string CategoryColorHex { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public TransactionType TransactionType { get; set; } = TransactionType.Expense;
    public DateTime TxnDate { get; set; } = DateTime.UtcNow.Date;
    public string? Note { get; set; }

    public long? TargetAccountId { get; set; }
    public string? EncryptedTargetAccountId
    {
        get => TargetAccountId.HasValue && TargetAccountId.Value > 0 ? EncryptionHelper.EncryptId(TargetAccountId.Value) : string.Empty;
        set
        {
            if (EncryptionHelper.TryDecryptId(value, out long decryptedId))
            {
                TargetAccountId = decryptedId;
            }
        }
    }
    public string? TargetAccountName { get; set; }

    public string? ClientTxnId { get; set; }

    public string? Validate(ValidationContext context)
    {
        if (context == ValidationContext.SaveTransaction)
        {
            if (Amount <= 0)
            {
                return AppConstants.MessageCodes.Transaction.AmountInvalid;
            }
            if (AccountId <= 0)
            {
                return AppConstants.MessageCodes.Transaction.AccountRequired;
            }
            if (CategoryId <= 0)
            {
                return AppConstants.MessageCodes.Transaction.CategoryRequired;
            }
            if (TransactionType == TransactionType.Transfer)
            {
                if (!TargetAccountId.HasValue || TargetAccountId.Value <= 0 || TargetAccountId.Value == AccountId)
                {
                    return AppConstants.MessageCodes.Transaction.InvalidTransferAccount;
                }
            }
        }

        return null;
    }
}

