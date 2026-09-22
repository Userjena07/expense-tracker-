IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CategoryAuditLog')
BEGIN
    CREATE TABLE [dbo].[CategoryAuditLog] (
        [Id]              BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [CategoryId]      BIGINT         NOT NULL,
        [UserId]          BIGINT         NOT NULL,
        [Name]            NVARCHAR(60)   NULL,
        [Icon]            VARCHAR(50)    NULL,
        [ColorHex]        VARCHAR(10)    NULL,
        [CategoryType]    TINYINT        NULL,
        [Action]          VARCHAR(20)    NOT NULL, -- INSERT / UPDATE / SOFTDELETE
        [ActionOn]        DATETIME       NOT NULL DEFAULT GETUTCDATE(),
        [ActionBy]        BIGINT         NOT NULL
    );
    PRINT 'Table CategoryAuditLog created successfully.';
END
GO
