IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'User')
BEGIN
    CREATE TABLE [dbo].[User] (
        [Id]            BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [FullName]      NVARCHAR(100) NOT NULL,
        [Email]         VARCHAR(256)  NOT NULL,
        [PasswordHash]  VARCHAR(200)  NOT NULL,
        [CurrencyCode]  VARCHAR(10)   NOT NULL DEFAULT 'INR',
        [MonthStartDay] TINYINT       NOT NULL DEFAULT 1,
        [Theme]         VARCHAR(20)   NOT NULL DEFAULT 'dark',
        [PinHash]       VARCHAR(200)  NULL,
        [IsBiometricOn] BIT           NOT NULL DEFAULT 0,
        [UpdatedBy]     BIGINT        NOT NULL DEFAULT 0,
        [UpdatedOn]     DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        [IsActive]      BIT           NOT NULL DEFAULT 1,
        [IsDeleted]     BIT           NOT NULL DEFAULT 0,
        [Metadata]      VARCHAR(MAX)  NOT NULL DEFAULT '{}'
    );
    PRINT 'Table User created successfully.';
END
GO
