IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'BudgetAuditLog')
BEGIN
    CREATE TABLE [dbo].[BudgetAuditLog] (
        [Id]         BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [BudgetId]   BIGINT         NOT NULL,
        [UserId]     BIGINT         NOT NULL,
        [CategoryId] BIGINT         NULL,
        [Amount]     DECIMAL(18,2)  NULL,
        [Month]      TINYINT        NULL,
        [Year]       SMALLINT       NULL,
        [Action]     VARCHAR(20)    NOT NULL, -- INSERT / UPDATE / SOFTDELETE
        [ActionOn]   DATETIME       NOT NULL DEFAULT GETUTCDATE(),
        [ActionBy]   BIGINT         NOT NULL
    );
    PRINT 'Table BudgetAuditLog created successfully.';
END
GO
