GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_GetUserByEmail
    @Email = 'gautam@example.com';
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_GetUserByEmail]
    @Email VARCHAR(256) = ''
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM [dbo].[User] WHERE [Email] = @Email AND [IsDeleted] = 0)
    BEGIN
        SELECT 0 AS [Status], 'AUTH_USER_NOT_FOUND' AS [MessageCode];
        RETURN;
    END

    SELECT 1 AS [Status], 'AUTH_USER_FOUND' AS [MessageCode];

    SELECT 
        [Id], [FullName], [Email], [PasswordHash], [CurrencyCode],
        [MonthStartDay], [Theme], [PinHash], [IsBiometricOn], [IsActive]
    FROM [dbo].[User]
    WHERE [Email] = @Email AND [IsDeleted] = 0;
END
GO
