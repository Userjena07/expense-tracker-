GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_GetBudgetList
    @RequestedBy  = 1,
    @SessionToken = 'jwt-session-guid',
    @Month        = 9,
    @Year         = 2026;
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_GetBudgetList]
    @RequestedBy  BIGINT       = 0,
    @SessionToken VARCHAR(500) = '',
    @Month        TINYINT      = 0,
    @Year         SMALLINT     = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.FN_Authorize(@RequestedBy, @SessionToken, '{}') = 0
    BEGIN
        SELECT 0 AS [Status], 'AUTH_SESSION_EXPIRED' AS [MessageCode];
        RETURN;
    END

    IF @Month = 0
        SET @Month = DATEPART(MONTH, GETUTCDATE());
    IF @Year = 0
        SET @Year = DATEPART(YEAR, GETUTCDATE());

    SELECT 1 AS [Status], 'BUDGET_LIST_SUCCESS' AS [MessageCode];

    -- Budgets with category names and computed spent amounts in that month/year
    SELECT 
        b.[Id],
        b.[UserId],
        b.[CategoryId],
        c.[Name]     AS [CategoryName],
        c.[Icon]     AS [CategoryIcon],
        c.[ColorHex] AS [CategoryColorHex],
        b.[Amount]   AS [BudgetAmount],
        b.[Month],
        b.[Year],
        CAST(
            ISNULL((
                SELECT SUM(t.[Amount])
                FROM [dbo].[Transaction] t
                WHERE t.[UserId] = @RequestedBy
                  AND t.[TransactionType] = 1 -- Expense
                  AND t.[IsDeleted] = 0
                  AND DATEPART(MONTH, t.[TxnDate]) = b.[Month]
                  AND DATEPART(YEAR, t.[TxnDate]) = b.[Year]
                  AND (b.[CategoryId] IS NULL OR t.[CategoryId] = b.[CategoryId])
            ), 0)
            AS DECIMAL(18,2)
        ) AS [SpentAmount]
    FROM [dbo].[Budget] b
    LEFT JOIN [dbo].[Category] c ON c.[Id] = b.[CategoryId]
    WHERE b.[UserId] = @RequestedBy
      AND b.[Month] = @Month
      AND b.[Year] = @Year
      AND b.[IsDeleted] = 0
    ORDER BY CASE WHEN b.[CategoryId] IS NULL THEN 0 ELSE 1 END, c.[Name];
END
GO
