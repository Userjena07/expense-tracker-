using System.Text.Json.Serialization;
using ExpenseTracker.Core.Constants;
using ExpenseTracker.Core.Enums;
using ExpenseTracker.Core.Responses;

namespace ExpenseTracker.Core.Entities;

public class User : CommonInfo
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    public string CurrencyCode { get; set; } = "INR";
    public byte MonthStartDay { get; set; } = 1;
    public string Theme { get; set; } = "dark";
    public string? Pin { get; set; }
    public bool IsBiometricOn { get; set; }

    public string RefreshToken { get; set; } = string.Empty;
    public string? DeviceInfo { get; set; }
    public string? IpAddress { get; set; }

    public string? Validate(ValidationContext context)
    {
        switch (context)
        {
            case ValidationContext.Register:
                if (string.IsNullOrWhiteSpace(FullName))
                {
                    return AppConstants.MessageCodes.User.FullNameRequired;
                }
                if (string.IsNullOrWhiteSpace(Email))
                {
                    return AppConstants.MessageCodes.User.EmailRequired;
                }
                if (!Email.Contains('@') || !Email.Contains('.'))
                {
                    return AppConstants.MessageCodes.User.EmailInvalid;
                }
                if (string.IsNullOrWhiteSpace(Password))
                {
                    return AppConstants.MessageCodes.User.PasswordRequired;
                }
                if (Password.Length < 6)
                {
                    return AppConstants.MessageCodes.User.PasswordMinLength;
                }
                break;

            case ValidationContext.Login:
                if (string.IsNullOrWhiteSpace(Email))
                {
                    return AppConstants.MessageCodes.User.EmailRequired;
                }
                if (string.IsNullOrWhiteSpace(Password))
                {
                    return AppConstants.MessageCodes.User.PasswordRequired;
                }
                break;

            case ValidationContext.RefreshToken:
                if (string.IsNullOrWhiteSpace(RefreshToken))
                {
                    return AppConstants.MessageCodes.Auth.RefreshTokenInvalid;
                }
                break;

            case ValidationContext.UpdateProfile:
                if (string.IsNullOrWhiteSpace(FullName))
                {
                    return AppConstants.MessageCodes.User.FullNameRequired;
                }
                break;
        }

        return null;
    }
}

