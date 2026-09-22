IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'UserSession')
BEGIN
    CREATE TABLE [dbo].[UserSession] (
        [Id]            BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [UserId]        BIGINT        NOT NULL,
        [SessionToken]  VARCHAR(500)  NOT NULL,
        [RefreshToken]  VARCHAR(500)  NOT NULL,
        [DeviceInfo]    NVARCHAR(200) NULL,
        [IpAddress]     VARCHAR(50)   NULL,
        [ExpiresAt]     DATETIME      NOT NULL,
        [RevokedAt]     DATETIME      NULL,
        [CreatedOn]     DATETIME      NOT NULL DEFAULT GETUTCDATE()
    );
    PRINT 'Table UserSession created successfully.';
END
GO
