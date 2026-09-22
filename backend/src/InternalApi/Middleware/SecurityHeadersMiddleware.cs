namespace ExpenseTracker.InternalApi.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            IHeaderDictionary headers = context.Response.Headers;

            // X-Content-Type-Options: nosniff
            if (!headers.ContainsKey("X-Content-Type-Options"))
            {
                headers["X-Content-Type-Options"] = "nosniff";
            }

            // X-Frame-Options: DENY
            if (!headers.ContainsKey("X-Frame-Options"))
            {
                headers["X-Frame-Options"] = "DENY";
            }

            // Referrer-Policy: no-referrer
            if (!headers.ContainsKey("Referrer-Policy"))
            {
                headers["Referrer-Policy"] = "no-referrer";
            }

            // Content-Security-Policy (Allow Swagger UI inline scripts/styles and data: images)
            if (!headers.ContainsKey("Content-Security-Policy"))
            {
                if (context.Request.Path.StartsWithSegments("/swagger"))
                {
                    headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none';";
                }
                else
                {
                    headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';";
                }
            }

            // Strict-Transport-Security
            if (!headers.ContainsKey("Strict-Transport-Security"))
            {
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
            }

            // Permissions-Policy
            if (!headers.ContainsKey("Permissions-Policy"))
            {
                headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
            }

            // Remove technology fingerprinting headers
            headers.Remove("Server");
            headers.Remove("X-Powered-By");

            return Task.CompletedTask;
        });

        await _next(context);
    }
}
