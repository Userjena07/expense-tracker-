namespace ExpenseTracker.Core.Settings;

public class ConnectionSettings
{
    public string DefaultConnection { get; set; } = string.Empty;
}

public class JwtSettings
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 15;
    public int RefreshTokenExpiryDays { get; set; } = 30;
}
