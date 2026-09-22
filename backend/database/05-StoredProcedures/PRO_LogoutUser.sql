GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_LogoutUser
    @RequestedBy  = 1,
    @SessionToken = 'jwt-session-guid';
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_LogoutUser]
    @RequestedBy  BIGINT       = 0,
    @SessionToken VARCHAR(500) = ''
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE [dbo].[UserSession]
    SET [RevokedAt] = GETUTCDATE()
    WHERE [UserId] = @RequestedBy 
      AND [SessionToken] = @SessionToken
      AND [RevokedAt] IS NULL;

    SELECT 1 AS [Status], 'AUTH_LOGOUT_SUCCESS' AS [MessageCode];
END
GO
