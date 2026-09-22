GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_RegisterUser
    @FullName      = N'Gautam Jena',
    @Email         = 'gautam@example.com',
    @PasswordHash  = 'hashed-pwd',
    @CurrencyCode  = 'INR',
    @MonthStartDay = 1,
    @Theme         = 'dark';
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_RegisterUser]
    @FullName      NVARCHAR(100) = N'',
    @Email         VARCHAR(256)  = '',
    @PasswordHash  VARCHAR(200)  = '',
    @CurrencyCode  VARCHAR(10)   = 'INR',
    @MonthStartDay TINYINT       = 1,
    @Theme         VARCHAR(20)   = 'dark'
AS
BEGIN
    SET NOCOUNT ON;

    -- Duplicate email check
    IF EXISTS (SELECT 1 FROM [dbo].[User] WHERE [Email] = @Email AND [IsDeleted] = 0)
    BEGIN
        SELECT 0 AS [Status], 'AUTH_EMAIL_ALREADY_EXISTS' AS [MessageCode];
        RETURN;
    END

    DECLARE @UserId BIGINT;
    DECLARE @Now DATETIME = GETUTCDATE();

    INSERT INTO [dbo].[User] (
        [FullName], [Email], [PasswordHash], [CurrencyCode],
        [MonthStartDay], [Theme], [UpdatedBy], [UpdatedOn], [IsActive], [IsDeleted]
    )
    VALUES (
        @FullName, @Email, @PasswordHash, @CurrencyCode,
        @MonthStartDay, @Theme, 0, @Now, 1, 0
    );

    SET @UserId = SCOPE_IDENTITY();

    -- Audit Log
    INSERT INTO [dbo].[UserAuditLog] ([UserId], [FullName], [Email], [CurrencyCode], [MonthStartDay], [Theme], [Action], [ActionOn], [ActionBy])
    VALUES (@UserId, @FullName, @Email, @CurrencyCode, @MonthStartDay, @Theme, 'INSERT', @Now, @UserId);

    -- Seed Default Accounts
    INSERT INTO [dbo].[Account] ([UserId], [Name], [AccountType], [OpeningBalance], [ColorHex], [Icon], [UpdatedBy], [UpdatedOn])
    VALUES 
        (@UserId, N'Cash', 1, 0.00, '#4CD3A5', 'cash', @UserId, @Now),
        (@UserId, N'Bank Account', 2, 0.00, '#5B3FE0', 'bank', @UserId, @Now),
        (@UserId, N'Pocket Money', 5, 0.00, '#A99BFF', 'wallet', @UserId, @Now);

    -- Seed Default Categories (Expense & Income)
    INSERT INTO [dbo].[Category] ([UserId], [Name], [Icon], [ColorHex], [CategoryType], [IsSystemDefault], [UpdatedBy], [UpdatedOn])
    VALUES
        (@UserId, N'Food & Dining', 'utensils', '#FF7A7A', 1, 1, @UserId, @Now),
        (@UserId, N'Shopping & Clothes', 'shopping-bag', '#A99BFF', 1, 1, @UserId, @Now),
        (@UserId, N'Transport & Commute', 'car', '#4CD3A5', 1, 1, @UserId, @Now),
        (@UserId, N'Entertainment & Fun', 'film', '#F4B740', 1, 1, @UserId, @Now),
        (@UserId, N'Bills & Utilities', 'receipt', '#5B3FE0', 1, 1, @UserId, @Now),
        (@UserId, N'Gadgets & Tech', 'smartphone', '#38BDF8', 1, 1, @UserId, @Now),
        (@UserId, N'Health & Fitness', 'heart', '#EC4899', 1, 1, @UserId, @Now),
        (@UserId, N'Salary', 'briefcase', '#4CD3A5', 2, 1, @UserId, @Now),
        (@UserId, N'Pocket Money / Allowance', 'gift', '#A99BFF', 2, 1, @UserId, @Now),
        (@UserId, N'Freelance / Side Gig', 'laptop', '#38BDF8', 2, 1, @UserId, @Now),
        (@UserId, N'Investments & Dividends', 'trending-up', '#10B981', 2, 1, @UserId, @Now);

    -- Result Contract
    SELECT 1 AS [Status], 'AUTH_REGISTER_SUCCESS' AS [MessageCode];

    SELECT 
        [Id], [FullName], [Email], [CurrencyCode], [MonthStartDay], [Theme], [IsBiometricOn]
    FROM [dbo].[User]
    WHERE [Id] = @UserId;
END
GO
