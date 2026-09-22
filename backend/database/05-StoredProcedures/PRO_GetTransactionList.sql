GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_GetTransactionList
    @RequestedBy     = 1,
    @SessionToken    = 'jwt-session-guid',
    @FromDate        = '2026-09-01',
    @ToDate          = '2026-09-30',
    @CategoryId      = 0,
    @AccountId       = 0,
    @TransactionType = 0,
    @Keyword         = N'',
    @PageNo          = 1,
    @PageSize        = 20;
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_GetTransactionList]
    @RequestedBy     BIGINT        = 0,
    @SessionToken    VARCHAR(500)  = '',
    @FromDate        DATE          = NULL,
    @ToDate          DATE          = NULL,
    @CategoryId      BIGINT        = 0,
    @AccountId       BIGINT        = 0,
    @TransactionType TINYINT       = 0,
    @Keyword         NVARCHAR(200) = N'',
    @PageNo          INT           = 1,
    @PageSize        INT           = 20
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.FN_Authorize(@RequestedBy, @SessionToken, '{}') = 0
    BEGIN
        SELECT 0 AS [Status], 'AUTH_SESSION_EXPIRED' AS [MessageCode];
        RETURN;
    END

    DECLARE @Offset INT = (@PageNo - 1) * @PageSize;

    SELECT 1 AS [Status], 'TRANSACTION_LIST_SUCCESS' AS [MessageCode];

    SELECT 
        COUNT(*) OVER() AS [TotalCount],
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
    WHERE t.[UserId] = @RequestedBy
      AND t.[IsDeleted] = 0
      AND (@FromDate IS NULL OR t.[TxnDate] >= @FromDate)
      AND (@ToDate IS NULL OR t.[TxnDate] <= @ToDate)
      AND (@CategoryId = 0 OR t.[CategoryId] = @CategoryId)
      AND (@AccountId = 0 OR t.[AccountId] = @AccountId OR t.[TargetAccountId] = @AccountId)
      AND (@TransactionType = 0 OR t.[TransactionType] = @TransactionType)
      AND (@Keyword = N'' OR t.[Note] LIKE N'%' + @Keyword + N'%' OR c.[Name] LIKE N'%' + @Keyword + N'%' OR a.[Name] LIKE N'%' + @Keyword + N'%')
    ORDER BY t.[TxnDate] DESC, t.[Id] DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
