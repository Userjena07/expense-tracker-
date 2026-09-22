-- Global System Default Categories (UserId = 0, IsSystemDefault = 1)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE [UserId] = 0 AND [Name] = N'Food & Dining')
BEGIN
    INSERT INTO [dbo].[Category] ([UserId], [Name], [Icon], [ColorHex], [CategoryType], [IsSystemDefault], [UpdatedBy], [UpdatedOn])
    VALUES (0, N'Food & Dining', 'utensils', '#FF7A7A', 1, 1, 0, GETUTCDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE [UserId] = 0 AND [Name] = N'Shopping & Clothes')
BEGIN
    INSERT INTO [dbo].[Category] ([UserId], [Name], [Icon], [ColorHex], [CategoryType], [IsSystemDefault], [UpdatedBy], [UpdatedOn])
    VALUES (0, N'Shopping & Clothes', 'shopping-bag', '#A99BFF', 1, 1, 0, GETUTCDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE [UserId] = 0 AND [Name] = N'Transport & Commute')
BEGIN
    INSERT INTO [dbo].[Category] ([UserId], [Name], [Icon], [ColorHex], [CategoryType], [IsSystemDefault], [UpdatedBy], [UpdatedOn])
    VALUES (0, N'Transport & Commute', 'car', '#4CD3A5', 1, 1, 0, GETUTCDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE [UserId] = 0 AND [Name] = N'Entertainment & Gaming')
BEGIN
    INSERT INTO [dbo].[Category] ([UserId], [Name], [Icon], [ColorHex], [CategoryType], [IsSystemDefault], [UpdatedBy], [UpdatedOn])
    VALUES (0, N'Entertainment & Gaming', 'gamepad', '#F4B740', 1, 1, 0, GETUTCDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE [UserId] = 0 AND [Name] = N'Bills & Utilities')
BEGIN
    INSERT INTO [dbo].[Category] ([UserId], [Name], [Icon], [ColorHex], [CategoryType], [IsSystemDefault], [UpdatedBy], [UpdatedOn])
    VALUES (0, N'Bills & Utilities', 'receipt', '#5B3FE0', 1, 1, 0, GETUTCDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE [UserId] = 0 AND [Name] = N'Gadgets & Tech')
BEGIN
    INSERT INTO [dbo].[Category] ([UserId], [Name], [Icon], [ColorHex], [CategoryType], [IsSystemDefault], [UpdatedBy], [UpdatedOn])
    VALUES (0, N'Gadgets & Tech', 'smartphone', '#38BDF8', 1, 1, 0, GETUTCDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE [UserId] = 0 AND [Name] = N'Health & Fitness')
BEGIN
    INSERT INTO [dbo].[Category] ([UserId], [Name], [Icon], [ColorHex], [CategoryType], [IsSystemDefault], [UpdatedBy], [UpdatedOn])
    VALUES (0, N'Health & Fitness', 'heart', '#EC4899', 1, 1, 0, GETUTCDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE [UserId] = 0 AND [Name] = N'Salary')
BEGIN
    INSERT INTO [dbo].[Category] ([UserId], [Name], [Icon], [ColorHex], [CategoryType], [IsSystemDefault], [UpdatedBy], [UpdatedOn])
    VALUES (0, N'Salary', 'briefcase', '#4CD3A5', 2, 1, 0, GETUTCDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE [UserId] = 0 AND [Name] = N'Pocket Money / Allowance')
BEGIN
    INSERT INTO [dbo].[Category] ([UserId], [Name], [Icon], [ColorHex], [CategoryType], [IsSystemDefault], [UpdatedBy], [UpdatedOn])
    VALUES (0, N'Pocket Money / Allowance', 'gift', '#A99BFF', 2, 1, 0, GETUTCDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE [UserId] = 0 AND [Name] = N'Freelance / Side Gig')
BEGIN
    INSERT INTO [dbo].[Category] ([UserId], [Name], [Icon], [ColorHex], [CategoryType], [IsSystemDefault], [UpdatedBy], [UpdatedOn])
    VALUES (0, N'Freelance / Side Gig', 'laptop', '#38BDF8', 2, 1, 0, GETUTCDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE [UserId] = 0 AND [Name] = N'Investments & Dividends')
BEGIN
    INSERT INTO [dbo].[Category] ([UserId], [Name], [Icon], [ColorHex], [CategoryType], [IsSystemDefault], [UpdatedBy], [UpdatedOn])
    VALUES (0, N'Investments & Dividends', 'trending-up', '#10B981', 2, 1, 0, GETUTCDATE());
END
GO

PRINT 'Default seed categories verified successfully.';
