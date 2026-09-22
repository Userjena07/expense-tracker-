using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using ExpenseTracker.Core.Settings;

namespace ExpenseTracker.InternalApi.Services;

public class SqlHealthCheck : IHealthCheck
{
    private readonly ConnectionSettings _connectionSettings;

    public SqlHealthCheck(IOptions<ConnectionSettings> connectionSettings)
    {
        _connectionSettings = connectionSettings.Value;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_connectionSettings.DefaultConnection))
        {
            return HealthCheckResult.Unhealthy("DefaultConnection is not configured.");
        }

        try
        {
            await using SqlConnection connection = new SqlConnection(_connectionSettings.DefaultConnection);
            await connection.OpenAsync(cancellationToken);
            await using SqlCommand command = new SqlCommand("SELECT 1", connection);
            await command.ExecuteScalarAsync(cancellationToken);
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("SQL Server connectivity check failed.", ex);
        }
    }
}
