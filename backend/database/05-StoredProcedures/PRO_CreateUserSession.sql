GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_CreateUserSession
    @UserId       = 1,
    @SessionToken = 'jwt-session-guid',
    @RefreshToken = 'refresh-token-guid',
    @DeviceInfo   = 'Android Expo Client',
    @IpAddress    = '192.168.1.5',
    @ExpiresAt    = '2026-10-21 00:00:00';
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_CreateUserSession]
    @UserId       BIGINT        = 0,
    @SessionToken VARCHAR(500)  = '',
    @RefreshToken VARCHAR(500)  = '',
    @DeviceInfo   NVARCHAR(200) = NULL,
    @IpAddress    VARCHAR(50)   = NULL,
    @ExpiresAt    DATETIME      = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @ExpiresAt IS NULL
        SET @ExpiresAt = DATEADD(DAY, 30, GETUTCDATE());

    DECLARE @Now DATETIME = GETUTCDATE();

    -- Invalidate previous active sessions for this user (R9: Single Active Session)
    UPDATE [dbo].[UserSession]
    SET [RevokedAt] = @Now
    WHERE [UserId] = @UserId AND [RevokedAt] IS NULL;

    -- Insert new session
    INSERT INTO [dbo].[UserSession] (
        [UserId], [SessionToken], [RefreshToken], [DeviceInfo],
        [IpAddress], [ExpiresAt], [RevokedAt], [CreatedOn]
    )
    VALUES (
        @UserId, @SessionToken, @RefreshToken, @DeviceInfo,
        @IpAddress, @ExpiresAt, NULL, @Now
    );

    SELECT 1 AS [Status], 'AUTH_SESSION_CREATED' AS [MessageCode];
END
GO
