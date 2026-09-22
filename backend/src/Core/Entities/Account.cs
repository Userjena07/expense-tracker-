using ExpenseTracker.Core.Constants;
using ExpenseTracker.Core.Enums;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.Core.Entities;

public class Account : CommonInfo
{
    public long UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public AccountType AccountType { get; set; } = AccountType.Cash;
    public decimal OpeningBalance { get; set; }
    public decimal CurrentBalance { get; set; }
    public string ColorHex { get; set; } = "#5B3FE0";
    public string Icon { get; set; } = "wallet";

    public string? Validate(ValidationContext context)
    {
        if (context == ValidationContext.SaveAccount)
        {
            if (string.IsNullOrWhiteSpace(Name))
            {
                return AppConstants.MessageCodes.Account.NameRequired;
            }
            if (!Enum.IsDefined(typeof(AccountType), AccountType))
            {
                return AppConstants.MessageCodes.Account.InvalidType;
            }
        }

        return null;
    }
}

