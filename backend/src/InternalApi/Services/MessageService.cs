using System.Text.Json;
using ExpenseTracker.Core.Interfaces;

namespace ExpenseTracker.InternalApi.Services;

public class MessageService : IMessageService
{
    private readonly Dictionary<string, string> _messages = new(StringComparer.OrdinalIgnoreCase);

    public MessageService(IWebHostEnvironment env)
    {
        string filePath = Path.Combine(env.ContentRootPath, "messages.json");
        if (File.Exists(filePath))
        {
            string json = File.ReadAllText(filePath);
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("messages", out JsonElement categories))
            {
                foreach (JsonProperty category in categories.EnumerateObject())
                {
                    string categoryName = category.Name;
                    foreach (JsonProperty msg in category.Value.EnumerateObject())
                    {
                        string code = $"{categoryName}_{msg.Name}".ToUpperInvariant();
                        _messages[code] = msg.Value.GetString() ?? string.Empty;
                    }
                }
            }
        }
    }

    public string Get(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return string.Empty;
        }

        return _messages.TryGetValue(code, out string? message)
            ? message
            : code;
    }
}
