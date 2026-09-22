IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserSession_Token' AND object_id = OBJECT_ID('[dbo].[UserSession]'))
BEGIN
    CREATE INDEX [IX_UserSession_Token] ON [dbo].[UserSession] ([UserId], [SessionToken], [ExpiresAt]) WHERE [RevokedAt] IS NULL;
    PRINT 'Index IX_UserSession_Token created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserSession_RefreshToken' AND object_id = OBJECT_ID('[dbo].[UserSession]'))
BEGIN
    CREATE INDEX [IX_UserSession_RefreshToken] ON [dbo].[UserSession] ([RefreshToken]) WHERE [RevokedAt] IS NULL;
    PRINT 'Index IX_UserSession_RefreshToken created.';
END
GO
