IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_User_Email' AND object_id = OBJECT_ID('[dbo].[User]'))
BEGIN
    CREATE UNIQUE INDEX [IX_User_Email] ON [dbo].[User] ([Email]) WHERE [IsDeleted] = 0;
    PRINT 'Index IX_User_Email created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_User_Active' AND object_id = OBJECT_ID('[dbo].[User]'))
BEGIN
    CREATE INDEX [IX_User_Active] ON [dbo].[User] ([UpdatedOn] DESC) WHERE [IsDeleted] = 0;
    PRINT 'Index IX_User_Active created.';
END
GO
