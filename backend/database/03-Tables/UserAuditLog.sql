IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'UserAuditLog')
BEGIN
    CREATE TABLE [dbo].[UserAuditLog] (
        [Id]            BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [UserId]        BIGINT        NOT NULL,
        [FullName]      NVARCHAR(100) NULL,
        [Email]         VARCHAR(256)  NULL,
        [CurrencyCode]  VARCHAR(10)   NULL,
        [MonthStartDay] TINYINT       NULL,
        [Theme]         VARCHAR(20)   NULL,
        [Action]        VARCHAR(20)   NOT NULL, -- INSERT / UPDATE / SOFTDELETE
        [ActionOn]      DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        [ActionBy]      BIGINT        NOT NULL
    );
    PRINT 'Table UserAuditLog created successfully.';
END
GO
