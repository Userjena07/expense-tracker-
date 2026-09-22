IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Transaction_User_TxnDate' AND object_id = OBJECT_ID('[dbo].[Transaction]'))
BEGIN
    CREATE INDEX [IX_Transaction_User_TxnDate] ON [dbo].[Transaction] ([UserId], [TxnDate] DESC) WHERE [IsDeleted] = 0;
    PRINT 'Index IX_Transaction_User_TxnDate created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Transaction_Account' AND object_id = OBJECT_ID('[dbo].[Transaction]'))
BEGIN
    CREATE INDEX [IX_Transaction_Account] ON [dbo].[Transaction] ([AccountId], [UserId]) WHERE [IsDeleted] = 0;
    PRINT 'Index IX_Transaction_Account created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Transaction_Category' AND object_id = OBJECT_ID('[dbo].[Transaction]'))
BEGIN
    CREATE INDEX [IX_Transaction_Category] ON [dbo].[Transaction] ([CategoryId], [UserId]) WHERE [IsDeleted] = 0;
    PRINT 'Index IX_Transaction_Category created.';
END
GO
