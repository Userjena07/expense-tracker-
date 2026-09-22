IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Category_UserId' AND object_id = OBJECT_ID('[dbo].[Category]'))
BEGIN
    CREATE INDEX [IX_Category_UserId] ON [dbo].[Category] ([UserId], [CategoryType], [UpdatedOn] DESC) WHERE [IsDeleted] = 0;
    PRINT 'Index IX_Category_UserId created.';
END
GO
