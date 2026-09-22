GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_GetCategorySummary
    @RequestedBy     = 1,
    @SessionToken    = 'jwt-session-guid',
    @Month           = 9,
    @Year            = 2026,
    @TransactionType = 1; -- 1: Expense, 2: Income
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_GetCategorySummary]
    @RequestedBy     BIGINT       = 0,
    @SessionToken    VARCHAR(500) = '',
    @Month           TINYINT      = 0,
    @Year            SMALLINT     = 0,
    @TransactionType TINYINT      = 1
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

    DECLARE @MonthStartDay TINYINT = 1;
    SELECT @MonthStartDay = [MonthStartDay] FROM [dbo].[User] WHERE [Id] = @RequestedBy;
    IF @MonthStartDay IS NULL OR @MonthStartDay < 1 OR @MonthStartDay > 28
        SET @MonthStartDay = 1;

    DECLARE @StartDate DATE = DATEFROMPARTS(@Year, @Month, @MonthStartDay);
    DECLARE @EndDate DATE = DATEADD(DAY, -1, DATEADD(MONTH, 1, @StartDate));

    -- Total Type Amount
    DECLARE @TotalAmount DECIMAL(18,2) = 0;
    SELECT @TotalAmount = ISNULL(SUM(t.[Amount]), 0)
    FROM [dbo].[Transaction] t
    WHERE t.[UserId] = @RequestedBy
      AND t.[TransactionType] = @TransactionType
      AND t.[TxnDate] >= @StartDate
      AND t.[TxnDate] <= @EndDate
      AND t.[IsDeleted] = 0;

    SELECT 1 AS [Status], 'SUMMARY_CATEGORY_SUCCESS' AS [MessageCode];

    SELECT 
        c.[Id]          AS [CategoryId],
        c.[Name]        AS [CategoryName],
        c.[Icon]        AS [CategoryIcon],
        c.[ColorHex]    AS [CategoryColorHex],
        ISNULL(SUM(t.[Amount]), 0) AS [TotalAmount],
        COUNT(t.[Id])   AS [TransactionCount],
        CASE 
            WHEN @TotalAmount > 0 THEN CAST((ISNULL(SUM(t.[Amount]), 0) * 100.0 / @TotalAmount) AS DECIMAL(5,2))
            ELSE 0.00
        END             AS [Percentage]
    FROM [dbo].[Category] c
    INNER JOIN [dbo].[Transaction] t ON t.[CategoryId] = c.[Id]
    WHERE t.[UserId] = @RequestedBy
      AND t.[TransactionType] = @TransactionType
      AND t.[TxnDate] >= @StartDate
      AND t.[TxnDate] <= @EndDate
      AND t.[IsDeleted] = 0
    GROUP BY c.[Id], c.[Name], c.[Icon], c.[ColorHex]
    ORDER BY [TotalAmount] DESC;
END
GO
