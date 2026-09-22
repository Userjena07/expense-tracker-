using System.Text.Json.Serialization;
using ExpenseTracker.Core.Helpers;

namespace ExpenseTracker.Core.Entities;

public abstract class CommonInfo
{
    public long Id { get; set; }

    public string EncryptedId
    {
        get => Id > 0 ? EncryptionHelper.EncryptId(Id) : string.Empty;
        set
        {
            if (EncryptionHelper.TryDecryptId(value, out long decryptedId))
            {
                Id = decryptedId;
            }
        }
    }

    [JsonIgnore]
    public long RequestedBy { get; set; }

    [JsonIgnore]
    public string SessionToken { get; set; } = string.Empty;

    public long UpdatedBy { get; set; }
    public DateTime UpdatedOn { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public string Metadata { get; set; } = "{}";
}
