IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Budget_User_Period' AND object_id = OBJECT_ID('[dbo].[Budget]'))
BEGIN
    CREATE INDEX [IX_Budget_User_Period] ON [dbo].[Budget] ([UserId], [Year], [Month]) WHERE [IsDeleted] = 0;
    PRINT 'Index IX_Budget_User_Period created.';
END
GO
