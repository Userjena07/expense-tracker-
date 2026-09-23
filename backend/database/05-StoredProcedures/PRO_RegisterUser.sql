GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_RegisterUser
    @FullName      = N'Gautam Jena',
    @Email         = 'gautam@example.com',
    @PasswordHash  = 'hashed-pwd',
    @CurrencyCode  = 'INR',
    @MonthStartDay = 1,
    @Theme         = 'dark';
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_RegisterUser]
    @FullName      NVARCHAR(100) = N'',
    @Email         VARCHAR(256)  = '',
    @PasswordHash  VARCHAR(200)  = '',
    @CurrencyCode  VARCHAR(10)   = 'INR',
    @MonthStartDay TINYINT       = 1,
    @Theme         VARCHAR(20)   = 'dark'
AS
BEGIN
    SET NOCOUNT ON;

    -- Duplicate email check
    IF EXISTS (SELECT 1 FROM [dbo].[User] WHERE [Email] = @Email AND [IsDeleted] = 0)
    BEGIN
        SELECT 0 AS [Status], 'AUTH_EMAIL_ALREADY_EXISTS' AS [MessageCode];
        RETURN;
    END

    DECLARE @UserId BIGINT;
    DECLARE @Now DATETIME = GETUTCDATE();

    INSERT INTO [dbo].[User] (
        [FullName], [Email], [PasswordHash], [CurrencyCode],
        [MonthStartDay], [Theme], [UpdatedBy], [UpdatedOn], [IsActive], [IsDeleted]
    )
    VALUES (
        @FullName, @Email, @PasswordHash, @CurrencyCode,
        @MonthStartDay, @Theme, 0, @Now, 1, 0
    );

    SET @UserId = SCOPE_IDENTITY();

    -- Audit Log
    INSERT INTO [dbo].[UserAuditLog] ([UserId], [FullName], [Email], [CurrencyCode], [MonthStartDay], [Theme], [Action], [ActionOn], [ActionBy])
    VALUES (@UserId, @FullName, @Email, @CurrencyCode, @MonthStartDay, @Theme, 'INSERT', @Now, @UserId);

    -- Seed Default Accounts
    INSERT INTO [dbo].[Account] ([UserId], [Name], [AccountType], [OpeningBalance], [ColorHex], [Icon], [UpdatedBy], [UpdatedOn])
    VALUES 
        (@UserId, N'Cash', 1, 0.00, '#4CD3A5', 'cash', @UserId, @Now),
        (@UserId, N'Bank Account', 2, 0.00, '#5B3FE0', 'bank', @UserId, @Now),
        (@UserId, N'Pocket Money', 5, 0.00, '#A99BFF', 'wallet', @UserId, @Now);

    -- Result Contract
    SELECT 1 AS [Status], 'AUTH_REGISTER_SUCCESS' AS [MessageCode];

    SELECT 
        [Id], [FullName], [Email], [CurrencyCode], [MonthStartDay], [Theme], [IsBiometricOn]
    FROM [dbo].[User]
    WHERE [Id] = @UserId;
END
GO
