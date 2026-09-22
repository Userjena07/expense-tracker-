IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Transaction')
BEGIN
    CREATE TABLE [dbo].[Transaction] (
        [Id]              BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [UserId]          BIGINT         NOT NULL,
        [AccountId]       BIGINT         NOT NULL,
        [CategoryId]      BIGINT         NOT NULL,
        [Amount]          DECIMAL(18,2)  NOT NULL,
        [TransactionType] TINYINT        NOT NULL DEFAULT 1, -- 1 Expense, 2 Income, 3 Transfer
        [TxnDate]         DATE           NOT NULL,
        [Note]            NVARCHAR(300)  NULL,
        [TargetAccountId] BIGINT         NULL, -- For transfer transactions
        [ClientTxnId]     VARCHAR(50)    NULL, -- Client GUID for offline sync & idempotency
        [UpdatedBy]       BIGINT         NOT NULL DEFAULT 0,
        [UpdatedOn]       DATETIME       NOT NULL DEFAULT GETUTCDATE(),
        [IsActive]        BIT            NOT NULL DEFAULT 1,
        [IsDeleted]       BIT            NOT NULL DEFAULT 0,
        [Metadata]        VARCHAR(MAX)   NOT NULL DEFAULT '{}'
    );
    PRINT 'Table Transaction created successfully.';
END
GO
