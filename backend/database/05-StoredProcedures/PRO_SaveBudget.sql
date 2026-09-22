GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_SaveBudget
    @RequestedBy  = 1,
    @SessionToken = 'jwt-session-guid',
    @CategoryId   = NULL, -- NULL = Total Monthly Budget
    @Amount       = 30000.00,
    @Month        = 9,
    @Year         = 2026;
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_SaveBudget]
    @RequestedBy  BIGINT        = 0,
    @SessionToken VARCHAR(500)  = '',
    @CategoryId   BIGINT        = NULL,
    @Amount       DECIMAL(18,2) = 0,
    @Month        TINYINT       = 0,
    @Year         SMALLINT      = 0
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

    -- Validate Category if specified
    IF @CategoryId IS NOT NULL AND @CategoryId > 0
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM [dbo].[Category] 
            WHERE [Id] = @CategoryId 
              AND ([UserId] = @RequestedBy OR ([UserId] = 0 AND [IsSystemDefault] = 1)) 
              AND [IsDeleted] = 0
        )
        BEGIN
            SELECT 0 AS [Status], 'CATEGORY_NOT_FOUND' AS [MessageCode];
            RETURN;
        END
    END
    ELSE
    BEGIN
        SET @CategoryId = NULL;
    END

    DECLARE @Now DATETIME = GETUTCDATE();
    DECLARE @BudgetId BIGINT;

    -- Check if budget record already exists
    SELECT @BudgetId = [Id]
    FROM [dbo].[Budget]
    WHERE [UserId] = @RequestedBy
      AND (([CategoryId] IS NULL AND @CategoryId IS NULL) OR [CategoryId] = @CategoryId)
      AND [Month] = @Month
      AND [Year] = @Year
      AND [IsDeleted] = 0;

    IF @BudgetId IS NULL
    BEGIN
        INSERT INTO [dbo].[Budget] (
            [UserId], [CategoryId], [Amount], [Month], [Year],
            [UpdatedBy], [UpdatedOn], [IsActive], [IsDeleted]
        )
        VALUES (
            @RequestedBy, @CategoryId, @Amount, @Month, @Year,
            @RequestedBy, @Now, 1, 0
        );

        SET @BudgetId = SCOPE_IDENTITY();

        -- Audit Log
        INSERT INTO [dbo].[BudgetAuditLog] ([BudgetId], [UserId], [CategoryId], [Amount], [Month], [Year], [Action], [ActionOn], [ActionBy])
        VALUES (@BudgetId, @RequestedBy, @CategoryId, @Amount, @Month, @Year, 'INSERT', @Now, @RequestedBy);

        SELECT 1 AS [Status], 'BUDGET_SAVE_SUCCESS' AS [MessageCode], @BudgetId AS [BudgetId];
    END
    ELSE
    BEGIN
        UPDATE [dbo].[Budget]
        SET [Amount]    = @Amount,
            [UpdatedBy] = @RequestedBy,
            [UpdatedOn] = @Now
        WHERE [Id] = @BudgetId;

        -- Audit Log
        INSERT INTO [dbo].[BudgetAuditLog] ([BudgetId], [UserId], [CategoryId], [Amount], [Month], [Year], [Action], [ActionOn], [ActionBy])
        VALUES (@BudgetId, @RequestedBy, @CategoryId, @Amount, @Month, @Year, 'UPDATE', @Now, @RequestedBy);

        SELECT 1 AS [Status], 'BUDGET_SAVE_SUCCESS' AS [MessageCode], @BudgetId AS [BudgetId];
    END

    -- Return updated list in second result set (R23)
    EXEC [dbo].[PRO_GetBudgetList]
        @RequestedBy  = @RequestedBy,
        @SessionToken = @SessionToken,
        @Month        = @Month,
        @Year         = @Year;
END
GO
