using ExpenseTracker.Core.Helpers;

namespace ExpenseTracker.Core.Entities;

public class FilterParamInfo : CommonInfo
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }

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

    public byte TransactionType { get; set; }
    public byte CategoryType { get; set; }
    public byte Month { get; set; }
    public short Year { get; set; }
    public string Keyword { get; set; } = string.Empty;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int TotalCount { get; set; }
}
