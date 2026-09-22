GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_GetAccountList
    @RequestedBy  = 1,
    @SessionToken = 'jwt-session-guid';
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_GetAccountList]
    @RequestedBy  BIGINT       = 0,
    @SessionToken VARCHAR(500) = ''
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.FN_Authorize(@RequestedBy, @SessionToken, '{}') = 0
    BEGIN
        SELECT 0 AS [Status], 'AUTH_SESSION_EXPIRED' AS [MessageCode];
        RETURN;
    END

    SELECT 1 AS [Status], 'ACCOUNT_LIST_SUCCESS' AS [MessageCode];

    -- Query accounts with dynamic computed balance
    SELECT 
        a.[Id],
        a.[UserId],
        a.[Name],
        a.[AccountType],
        a.[OpeningBalance],
        a.[ColorHex],
        a.[Icon],
        a.[UpdatedOn],
        a.[IsActive],
        CAST(
            a.[OpeningBalance]
            + ISNULL((SELECT SUM(t.[Amount]) FROM [dbo].[Transaction] t WHERE t.[AccountId] = a.[Id] AND t.[UserId] = @RequestedBy AND t.[TransactionType] = 2 AND t.[IsDeleted] = 0), 0)
            - ISNULL((SELECT SUM(t.[Amount]) FROM [dbo].[Transaction] t WHERE t.[AccountId] = a.[Id] AND t.[UserId] = @RequestedBy AND t.[TransactionType] = 1 AND t.[IsDeleted] = 0), 0)
            - ISNULL((SELECT SUM(t.[Amount]) FROM [dbo].[Transaction] t WHERE t.[AccountId] = a.[Id] AND t.[UserId] = @RequestedBy AND t.[TransactionType] = 3 AND t.[IsDeleted] = 0), 0)
            + ISNULL((SELECT SUM(t.[Amount]) FROM [dbo].[Transaction] t WHERE t.[TargetAccountId] = a.[Id] AND t.[UserId] = @RequestedBy AND t.[TransactionType] = 3 AND t.[IsDeleted] = 0), 0)
            AS DECIMAL(18,2)
        ) AS [CurrentBalance]
    FROM [dbo].[Account] a
    WHERE a.[UserId] = @RequestedBy AND a.[IsDeleted] = 0
    ORDER BY a.[Id] ASC;
END
GO
