GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_GetTransactionById
    @Id           = 1,
    @RequestedBy  = 1,
    @SessionToken = 'jwt-session-guid';
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_GetTransactionById]
    @Id           BIGINT       = 0,
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

    IF NOT EXISTS (SELECT 1 FROM [dbo].[Transaction] WHERE [Id] = @Id AND [UserId] = @RequestedBy AND [IsDeleted] = 0)
    BEGIN
        SELECT 0 AS [Status], 'TRANSACTION_NOT_FOUND' AS [MessageCode];
        RETURN;
    END

    SELECT 1 AS [Status], 'TRANSACTION_FOUND' AS [MessageCode];

    SELECT 
        t.[Id],
        t.[UserId],
        t.[AccountId],
        a.[Name]        AS [AccountName],
        a.[ColorHex]    AS [AccountColorHex],
        t.[CategoryId],
        c.[Name]        AS [CategoryName],
        c.[Icon]        AS [CategoryIcon],
        c.[ColorHex]    AS [CategoryColorHex],
        t.[Amount],
        t.[TransactionType],
        t.[TxnDate],
        t.[Note],
        t.[TargetAccountId],
        ta.[Name]       AS [TargetAccountName],
        t.[ClientTxnId],
        t.[UpdatedOn],
        t.[IsActive]
    FROM [dbo].[Transaction] t
    INNER JOIN [dbo].[Account] a ON a.[Id] = t.[AccountId]
    INNER JOIN [dbo].[Category] c ON c.[Id] = t.[CategoryId]
    LEFT JOIN [dbo].[Account] ta ON ta.[Id] = t.[TargetAccountId]
    WHERE t.[Id] = @Id AND t.[UserId] = @RequestedBy AND t.[IsDeleted] = 0;
END
GO
