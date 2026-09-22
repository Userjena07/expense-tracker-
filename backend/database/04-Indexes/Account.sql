IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Account_UserId' AND object_id = OBJECT_ID('[dbo].[Account]'))
BEGIN
    CREATE INDEX [IX_Account_UserId] ON [dbo].[Account] ([UserId], [UpdatedOn] DESC) WHERE [IsDeleted] = 0;
    PRINT 'Index IX_Account_UserId created.';
END
GO
