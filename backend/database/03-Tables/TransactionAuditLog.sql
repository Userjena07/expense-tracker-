IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TransactionAuditLog')
BEGIN
    CREATE TABLE [dbo].[TransactionAuditLog] (
        [Id]              BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [TransactionId]   BIGINT         NOT NULL,
        [UserId]          BIGINT         NOT NULL,
        [AccountId]       BIGINT         NULL,
        [CategoryId]      BIGINT         NULL,
        [Amount]          DECIMAL(18,2)  NULL,
        [TransactionType] TINYINT        NULL,
        [TxnDate]         DATE           NULL,
        [Action]          VARCHAR(20)    NOT NULL, -- INSERT / UPDATE / SOFTDELETE
        [ActionOn]        DATETIME       NOT NULL DEFAULT GETUTCDATE(),
        [ActionBy]        BIGINT         NOT NULL
    );
    PRINT 'Table TransactionAuditLog created successfully.';
END
GO
