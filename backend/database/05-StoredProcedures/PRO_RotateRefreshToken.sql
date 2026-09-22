GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_RotateRefreshToken
    @OldRefreshToken = 'old-refresh-token',
    @NewSessionToken = 'new-session-guid',
    @NewRefreshToken = 'new-refresh-token',
    @ExpiresAt       = '2026-10-21 00:00:00';
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_RotateRefreshToken]
    @OldRefreshToken VARCHAR(500) = '',
    @NewSessionToken VARCHAR(500) = '',
    @NewRefreshToken VARCHAR(500) = '',
    @ExpiresAt       DATETIME     = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserId BIGINT;
    DECLARE @SessionId BIGINT;

    SELECT TOP 1
        @SessionId = [Id],
        @UserId    = [UserId]
    FROM [dbo].[UserSession]
    WHERE [RefreshToken] = @OldRefreshToken
      AND [RevokedAt] IS NULL
      AND [ExpiresAt] > GETUTCDATE();

    IF @SessionId IS NULL
    BEGIN
        SELECT 0 AS [Status], 'AUTH_REFRESH_TOKEN_INVALID' AS [MessageCode];
        RETURN;
    END

    IF @ExpiresAt IS NULL
        SET @ExpiresAt = DATEADD(DAY, 30, GETUTCDATE());

    DECLARE @Now DATETIME = GETUTCDATE();

    -- Revoke old session row
    UPDATE [dbo].[UserSession]
    SET [RevokedAt] = @Now
    WHERE [Id] = @SessionId;

    -- Insert rotated session
    INSERT INTO [dbo].[UserSession] (
        [UserId], [SessionToken], [RefreshToken], [DeviceInfo],
        [IpAddress], [ExpiresAt], [RevokedAt], [CreatedOn]
    )
    VALUES (
        @UserId, @NewSessionToken, @NewRefreshToken, NULL,
        NULL, @ExpiresAt, NULL, @Now
    );

    SELECT 1 AS [Status], 'AUTH_REFRESH_SUCCESS' AS [MessageCode];

    SELECT 
        [Id], [FullName], [Email], [CurrencyCode],
        [MonthStartDay], [Theme], [IsBiometricOn]
    FROM [dbo].[User]
    WHERE [Id] = @UserId AND [IsDeleted] = 0;
END
GO
