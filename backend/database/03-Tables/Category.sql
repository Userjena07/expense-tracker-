IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Category')
BEGIN
    CREATE TABLE [dbo].[Category] (
        [Id]              BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [UserId]          BIGINT         NOT NULL DEFAULT 0, -- 0 indicates system global category
        [Name]            NVARCHAR(60)   NOT NULL,
        [Icon]            VARCHAR(50)    NOT NULL DEFAULT 'tag',
        [ColorHex]        VARCHAR(10)    NOT NULL DEFAULT '#5B3FE0',
        [CategoryType]    TINYINT        NOT NULL DEFAULT 1, -- 1 Expense, 2 Income
        [IsSystemDefault] BIT            NOT NULL DEFAULT 0,
        [UpdatedBy]       BIGINT         NOT NULL DEFAULT 0,
        [UpdatedOn]       DATETIME       NOT NULL DEFAULT GETUTCDATE(),
        [IsActive]        BIT            NOT NULL DEFAULT 1,
        [IsDeleted]       BIT            NOT NULL DEFAULT 0,
        [Metadata]        VARCHAR(MAX)   NOT NULL DEFAULT '{}'
    );
    PRINT 'Table Category created successfully.';
END
GO
