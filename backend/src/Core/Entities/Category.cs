using ExpenseTracker.Core.Constants;
using ExpenseTracker.Core.Enums;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.Core.Entities;

public class Category : CommonInfo
{
    public long UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "tag";
    public string ColorHex { get; set; } = "#5B3FE0";
    public CategoryType CategoryType { get; set; } = CategoryType.Expense;
    public bool IsSystemDefault { get; set; }

    public string? Validate(ValidationContext context)
    {
        if (context == ValidationContext.SaveCategory)
        {
            if (string.IsNullOrWhiteSpace(Name))
            {
                return AppConstants.MessageCodes.Category.NameRequired;
            }
        }

        return null;
    }
}

