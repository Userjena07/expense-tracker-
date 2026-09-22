GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_GetDailySummary
    @RequestedBy  = 1,
    @SessionToken = 'jwt-session-guid',
    @Month        = 9,
    @Year         = 2026;
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_GetDailySummary]
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

    DECLARE @StartDate DATE = DATEFROMPARTS(@Year, @Month, @MonthStartDay);
    DECLARE @EndDate DATE = DATEADD(DAY, -1, DATEADD(MONTH, 1, @StartDate));

    SELECT 1 AS [Status], 'SUMMARY_DAILY_SUCCESS' AS [MessageCode];

    SELECT 
        t.[TxnDate],
        ISNULL(SUM(CASE WHEN t.[TransactionType] = 1 THEN t.[Amount] ELSE 0 END), 0) AS [ExpenseTotal],
        ISNULL(SUM(CASE WHEN t.[TransactionType] = 2 THEN t.[Amount] ELSE 0 END), 0) AS [IncomeTotal],
        COUNT(t.[Id]) AS [TransactionCount]
    FROM [dbo].[Transaction] t
    WHERE t.[UserId] = @RequestedBy
      AND t.[TxnDate] >= @StartDate
      AND t.[TxnDate] <= @EndDate
      AND t.[IsDeleted] = 0
    GROUP BY t.[TxnDate]
    ORDER BY t.[TxnDate] ASC;
END
GO
