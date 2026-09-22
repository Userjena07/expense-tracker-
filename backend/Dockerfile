# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy sln and csproj files first for layer caching
COPY ExpenseTracker.slnx ./
COPY src/Core/ExpenseTracker.Core.csproj src/Core/
COPY src/Repository/ExpenseTracker.Repository.csproj src/Repository/
COPY src/InternalApi/ExpenseTracker.InternalApi.csproj src/InternalApi/

# Restore dependencies
RUN dotnet restore src/InternalApi/ExpenseTracker.InternalApi.csproj

# Copy full source
COPY src/ src/

# Build and Publish
WORKDIR /app/src/InternalApi
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Environment Defaults
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=5050
EXPOSE 5050

ENTRYPOINT ["dotnet", "ExpenseTracker.InternalApi.dll"]
