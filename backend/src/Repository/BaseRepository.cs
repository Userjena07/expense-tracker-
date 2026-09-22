using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using ExpenseTracker.Core.Settings;

namespace ExpenseTracker.Repository;

public abstract class BaseRepository
{
    private readonly ConnectionSettings _connectionSettings;

    protected BaseRepository(IOptions<ConnectionSettings> connectionSettings)
    {
        _connectionSettings = connectionSettings.Value;
    }

    protected SqlConnection CreateConnection()
    {
        return new SqlConnection(_connectionSettings.DefaultConnection);
    }
}
