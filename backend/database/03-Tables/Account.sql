IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Account')
BEGIN
    CREATE TABLE [dbo].[Account] (
        [Id]             BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [UserId]         BIGINT         NOT NULL,
        [Name]           NVARCHAR(60)   NOT NULL,
        [AccountType]    TINYINT        NOT NULL DEFAULT 1, -- 1 Cash, 2 Bank, 3 Card, 4 Wallet, 5 Pocket Money / Allowance
        [OpeningBalance] DECIMAL(18,2)  NOT NULL DEFAULT 0,
        [ColorHex]       VARCHAR(10)    NOT NULL DEFAULT '#A99BFF',
        [Icon]           VARCHAR(50)    NOT NULL DEFAULT 'wallet',
        [UpdatedBy]      BIGINT         NOT NULL DEFAULT 0,
        [UpdatedOn]      DATETIME       NOT NULL DEFAULT GETUTCDATE(),
        [IsActive]       BIT            NOT NULL DEFAULT 1,
        [IsDeleted]      BIT            NOT NULL DEFAULT 0,
        [Metadata]       VARCHAR(MAX)   NOT NULL DEFAULT '{}'
    );
    PRINT 'Table Account created successfully.';
END
GO
