GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_ValidateSession
    @RequestedBy  = 1,
    @SessionToken = 'jwt-session-guid';
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_ValidateSession]
    @RequestedBy  BIGINT        = 0,
    @SessionToken VARCHAR(500)  = ''
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.FN_Authorize(@RequestedBy, @SessionToken, '{}') = 0
    BEGIN
        SELECT 0 AS [Status], 'AUTH_SESSION_EXPIRED' AS [MessageCode];
        RETURN;
    END

    SELECT 1 AS [Status], 'AUTH_SESSION_VALID' AS [MessageCode];

    SELECT 
        [Id], [FullName], [Email], [CurrencyCode],
        [MonthStartDay], [Theme], [IsBiometricOn]
    FROM [dbo].[User]
    WHERE [Id] = @RequestedBy AND [IsDeleted] = 0;
END
GO
