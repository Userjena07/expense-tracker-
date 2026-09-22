GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_UpdateUserProfile
    @RequestedBy   = 1,
    @SessionToken  = 'jwt-session-guid',
    @FullName      = N'Gautam Jena',
    @CurrencyCode  = 'INR',
    @MonthStartDay = 1,
    @Theme         = 'dark',
    @IsBiometricOn = 1;
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_UpdateUserProfile]
    @RequestedBy   BIGINT        = 0,
    @SessionToken  VARCHAR(500)  = '',
    @FullName      NVARCHAR(100) = NULL,
    @CurrencyCode  VARCHAR(10)   = NULL,
    @MonthStartDay TINYINT       = NULL,
    @Theme         VARCHAR(20)   = NULL,
    @IsBiometricOn BIT           = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.FN_Authorize(@RequestedBy, @SessionToken, '{}') = 0
    BEGIN
        SELECT 0 AS [Status], 'AUTH_SESSION_EXPIRED' AS [MessageCode];
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM [dbo].[User] WHERE [Id] = @RequestedBy AND [IsDeleted] = 0)
    BEGIN
        SELECT 0 AS [Status], 'USER_NOT_FOUND' AS [MessageCode];
        RETURN;
    END

    DECLARE @Now DATETIME = GETUTCDATE();

    UPDATE [dbo].[User]
    SET [FullName]      = COALESCE(@FullName, [FullName]),
        [CurrencyCode]  = COALESCE(@CurrencyCode, [CurrencyCode]),
        [MonthStartDay] = COALESCE(@MonthStartDay, [MonthStartDay]),
        [Theme]         = COALESCE(@Theme, [Theme]),
        [IsBiometricOn] = COALESCE(@IsBiometricOn, [IsBiometricOn]),
        [UpdatedBy]     = @RequestedBy,
        [UpdatedOn]     = @Now
    WHERE [Id] = @RequestedBy AND [IsDeleted] = 0;

    -- Audit Log
    INSERT INTO [dbo].[UserAuditLog] ([UserId], [FullName], [CurrencyCode], [MonthStartDay], [Theme], [Action], [ActionOn], [ActionBy])
    VALUES (@RequestedBy, @FullName, @CurrencyCode, @MonthStartDay, @Theme, 'UPDATE', @Now, @RequestedBy);

    SELECT 1 AS [Status], 'USER_PROFILE_UPDATED' AS [MessageCode];

    SELECT 
        [Id], [FullName], [Email], [CurrencyCode],
        [MonthStartDay], [Theme], [IsBiometricOn], [UpdatedOn]
    FROM [dbo].[User]
    WHERE [Id] = @RequestedBy AND [IsDeleted] = 0;
END
GO
