IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AccountAuditLog')
BEGIN
    CREATE TABLE [dbo].[AccountAuditLog] (
        [Id]             BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [AccountId]      BIGINT         NOT NULL,
        [UserId]         BIGINT         NOT NULL,
        [Name]           NVARCHAR(60)   NULL,
        [AccountType]    TINYINT        NULL,
        [OpeningBalance] DECIMAL(18,2)  NULL,
        [Action]         VARCHAR(20)    NOT NULL, -- INSERT / UPDATE / SOFTDELETE
        [ActionOn]       DATETIME       NOT NULL DEFAULT GETUTCDATE(),
        [ActionBy]       BIGINT         NOT NULL
    );
    PRINT 'Table AccountAuditLog created successfully.';
END
GO
