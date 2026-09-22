GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_GetMonthlySummary
    @RequestedBy  = 1,
    @SessionToken = 'jwt-session-guid',
    @Month        = 9,
    @Year         = 2026;
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_GetMonthlySummary]
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

    DECLARE @MonthStartDay TINYINT = 1;
    SELECT @MonthStartDay = [MonthStartDay] FROM [dbo].[User] WHERE [Id] = @RequestedBy;
    IF @MonthStartDay IS NULL OR @MonthStartDay < 1 OR @MonthStartDay > 28
        SET @MonthStartDay = 1;

    -- Calculate Start and End Date of the user's monthly cycle
    DECLARE @StartDate DATE = DATEFROMPARTS(@Year, @Month, @MonthStartDay);
    DECLARE @EndDate DATE = DATEADD(DAY, -1, DATEADD(MONTH, 1, @StartDate));

    -- Total Income & Total Expense
    DECLARE @TotalIncome DECIMAL(18,2) = 0;
    DECLARE @TotalExpense DECIMAL(18,2) = 0;

    SELECT 
        @TotalIncome = ISNULL(SUM(CASE WHEN [TransactionType] = 2 THEN [Amount] ELSE 0 END), 0),
        @TotalExpense = ISNULL(SUM(CASE WHEN [TransactionType] = 1 THEN [Amount] ELSE 0 END), 0)
    FROM [dbo].[Transaction]
    WHERE [UserId] = @RequestedBy
      AND [TxnDate] >= @StartDate
      AND [TxnDate] <= @EndDate
      AND [IsDeleted] = 0;

    -- Total Budget for this month
    DECLARE @TotalBudget DECIMAL(18,2) = 0;
    SELECT @TotalBudget = ISNULL([Amount], 0)
    FROM [dbo].[Budget]
    WHERE [UserId] = @RequestedBy
      AND [CategoryId] IS NULL
      AND [Month] = @Month
      AND [Year] = @Year
      AND [IsDeleted] = 0;

    -- Overall Net Balance across all user accounts using CTE
    DECLARE @TotalAccountBalance DECIMAL(18,2) = 0;
    
    ;WITH AccountBalances AS (
        SELECT 
            a.[OpeningBalance]
            + ISNULL((SELECT SUM(t.[Amount]) FROM [dbo].[Transaction] t WHERE t.[AccountId] = a.[Id] AND t.[UserId] = @RequestedBy AND t.[TransactionType] = 2 AND t.[IsDeleted] = 0), 0)
            - ISNULL((SELECT SUM(t.[Amount]) FROM [dbo].[Transaction] t WHERE t.[AccountId] = a.[Id] AND t.[UserId] = @RequestedBy AND t.[TransactionType] = 1 AND t.[IsDeleted] = 0), 0)
            AS [Balance]
        FROM [dbo].[Account] a
        WHERE a.[UserId] = @RequestedBy AND a.[IsDeleted] = 0
    )
    SELECT @TotalAccountBalance = ISNULL(SUM([Balance]), 0) FROM AccountBalances;

    -- Days Left in cycle (including today)
    DECLARE @Today DATE = CAST(GETUTCDATE() AS DATE);
    DECLARE @DaysLeft INT;

    IF @Today > @EndDate
        SET @DaysLeft = 1;
    ELSE IF @Today < @StartDate
        SET @DaysLeft = DATEDIFF(DAY, @StartDate, @EndDate) + 1;
    ELSE
        SET @DaysLeft = DATEDIFF(DAY, @Today, @EndDate) + 1;

    IF @DaysLeft <= 0
        SET @DaysLeft = 1;

    -- Safe to spend today
    DECLARE @SafeToSpendToday DECIMAL(18,2) = 0;
    IF @TotalBudget > 0
    BEGIN
        IF @TotalBudget > @TotalExpense
            SET @SafeToSpendToday = CAST((@TotalBudget - @TotalExpense) / @DaysLeft AS DECIMAL(18,2));
        ELSE
            SET @SafeToSpendToday = 0.00;
    END
    ELSE
    BEGIN
        IF @TotalIncome > @TotalExpense
            SET @SafeToSpendToday = CAST((@TotalIncome - @TotalExpense) / @DaysLeft AS DECIMAL(18,2));
        ELSE
            SET @SafeToSpendToday = 0.00;
    END

    SELECT 1 AS [Status], 'SUMMARY_MONTHLY_SUCCESS' AS [MessageCode];

    SELECT 
        @Month                  AS [Month],
        @Year                   AS [Year],
        @StartDate              AS [CycleStartDate],
        @EndDate                AS [CycleEndDate],
        @TotalIncome            AS [TotalIncome],
        @TotalExpense           AS [TotalExpense],
        (@TotalIncome - @TotalExpense) AS [NetSavings],
        @TotalAccountBalance    AS [TotalAccountBalance],
        @TotalBudget            AS [TotalBudget],
        CASE 
            WHEN @TotalBudget > @TotalExpense THEN CAST((@TotalBudget - @TotalExpense) AS DECIMAL(18,2))
            ELSE 0.00 
        END                     AS [BudgetRemaining],
        @DaysLeft               AS [DaysRemainingInCycle],
        @SafeToSpendToday       AS [SafeToSpendToday];
END
GO
