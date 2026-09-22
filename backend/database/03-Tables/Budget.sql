IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Budget')
BEGIN
    CREATE TABLE [dbo].[Budget] (
        [Id]         BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [UserId]     BIGINT         NOT NULL,
        [CategoryId] BIGINT         NULL, -- NULL denotes total overall monthly budget
        [Amount]     DECIMAL(18,2)  NOT NULL,
        [Month]      TINYINT        NOT NULL,
        [Year]       SMALLINT       NOT NULL,
        [UpdatedBy]  BIGINT         NOT NULL DEFAULT 0,
        [UpdatedOn]  DATETIME       NOT NULL DEFAULT GETUTCDATE(),
        [IsActive]   BIT            NOT NULL DEFAULT 1,
        [IsDeleted]  BIT            NOT NULL DEFAULT 0,
        [Metadata]   VARCHAR(MAX)   NOT NULL DEFAULT '{}'
    );
    PRINT 'Table Budget created successfully.';
END
GO
