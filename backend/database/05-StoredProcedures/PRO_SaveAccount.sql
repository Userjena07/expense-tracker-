GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_SaveAccount
    @Id             = 0,
    @RequestedBy    = 1,
    @SessionToken   = 'jwt-session-guid',
    @Name           = N'Savings Account',
    @AccountType    = 2,
    @OpeningBalance = 5000.00,
    @ColorHex       = '#5B3FE0',
    @Icon           = 'bank';
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_SaveAccount]
    @Id             BIGINT         = 0,
    @RequestedBy    BIGINT         = 0,
    @SessionToken   VARCHAR(500)   = '',
    @Name           NVARCHAR(60)   = N'',
    @AccountType    TINYINT        = 1,
    @OpeningBalance DECIMAL(18,2)  = 0,
    @ColorHex       VARCHAR(10)    = '#5B3FE0',
    @Icon           VARCHAR(50)    = 'wallet'
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.FN_Authorize(@RequestedBy, @SessionToken, '{}') = 0
    BEGIN
        SELECT 0 AS [Status], 'AUTH_SESSION_EXPIRED' AS [MessageCode];
        RETURN;
    END

    DECLARE @Now DATETIME = GETUTCDATE();

    IF @Id = 0
    BEGIN
        INSERT INTO [dbo].[Account] (
            [UserId], [Name], [AccountType], [OpeningBalance],
            [ColorHex], [Icon], [UpdatedBy], [UpdatedOn], [IsActive], [IsDeleted]
        )
        VALUES (
            @RequestedBy, @Name, @AccountType, @OpeningBalance,
            @ColorHex, @Icon, @RequestedBy, @Now, 1, 0
        );

        SET @Id = SCOPE_IDENTITY();

        -- Audit Log
        INSERT INTO [dbo].[AccountAuditLog] ([AccountId], [UserId], [Name], [AccountType], [OpeningBalance], [Action], [ActionOn], [ActionBy])
        VALUES (@Id, @RequestedBy, @Name, @AccountType, @OpeningBalance, 'INSERT', @Now, @RequestedBy);

        SELECT 1 AS [Status], 'ACCOUNT_SAVE_SUCCESS' AS [MessageCode], @Id AS [AccountId];
    END
    ELSE
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM [dbo].[Account] WHERE [Id] = @Id AND [UserId] = @RequestedBy AND [IsDeleted] = 0)
        BEGIN
            SELECT 0 AS [Status], 'ACCOUNT_NOT_FOUND' AS [MessageCode];
            RETURN;
        END

        UPDATE [dbo].[Account]
        SET [Name]           = @Name,
            [AccountType]    = @AccountType,
            [OpeningBalance] = @OpeningBalance,
            [ColorHex]       = @ColorHex,
            [Icon]           = @Icon,
            [UpdatedBy]      = @RequestedBy,
            [UpdatedOn]      = @Now
        WHERE [Id] = @Id AND [UserId] = @RequestedBy AND [IsDeleted] = 0;

        -- Audit Log
        INSERT INTO [dbo].[AccountAuditLog] ([AccountId], [UserId], [Name], [AccountType], [OpeningBalance], [Action], [ActionOn], [ActionBy])
        VALUES (@Id, @RequestedBy, @Name, @AccountType, @OpeningBalance, 'UPDATE', @Now, @RequestedBy);

        SELECT 1 AS [Status], 'ACCOUNT_SAVE_SUCCESS' AS [MessageCode], @Id AS [AccountId];
    END

    -- Return updated list in second result set (R23)
    EXEC [dbo].[PRO_GetAccountList]
        @RequestedBy  = @RequestedBy,
        @SessionToken = @SessionToken;
END
GO
