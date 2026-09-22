GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_SaveCategory
    @Id           = 0,
    @RequestedBy  = 1,
    @SessionToken = 'jwt-session-guid',
    @Name         = N'Gaming & Subscriptions',
    @Icon         = 'gamepad',
    @ColorHex     = '#EC4899',
    @CategoryType = 1;
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_SaveCategory]
    @Id           BIGINT       = 0,
    @RequestedBy  BIGINT       = 0,
    @SessionToken VARCHAR(500) = '',
    @Name         NVARCHAR(60) = N'',
    @Icon         VARCHAR(50)  = 'tag',
    @ColorHex     VARCHAR(10)  = '#5B3FE0',
    @CategoryType TINYINT      = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.FN_Authorize(@RequestedBy, @SessionToken, '{}') = 0
    BEGIN
        SELECT 0 AS [Status], 'AUTH_SESSION_EXPIRED' AS [MessageCode];
        RETURN;
    END

    DECLARE @Now DATETIME = GETUTCDATE();

    IF @Id = 0
    BEGIN
        INSERT INTO [dbo].[Category] (
            [UserId], [Name], [Icon], [ColorHex],
            [CategoryType], [IsSystemDefault], [UpdatedBy], [UpdatedOn], [IsActive], [IsDeleted]
        )
        VALUES (
            @RequestedBy, @Name, @Icon, @ColorHex,
            @CategoryType, 0, @RequestedBy, @Now, 1, 0
        );

        SET @Id = SCOPE_IDENTITY();

        -- Audit Log
        INSERT INTO [dbo].[CategoryAuditLog] ([CategoryId], [UserId], [Name], [Icon], [ColorHex], [CategoryType], [Action], [ActionOn], [ActionBy])
        VALUES (@Id, @RequestedBy, @Name, @Icon, @ColorHex, @CategoryType, 'INSERT', @Now, @RequestedBy);

        SELECT 1 AS [Status], 'CATEGORY_SAVE_SUCCESS' AS [MessageCode], @Id AS [CategoryId];
    END
    ELSE
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE [Id] = @Id AND [UserId] = @RequestedBy AND [IsDeleted] = 0)
        BEGIN
            SELECT 0 AS [Status], 'CATEGORY_NOT_FOUND' AS [MessageCode];
            RETURN;
        END

        UPDATE [dbo].[Category]
        SET [Name]         = @Name,
            [Icon]         = @Icon,
            [ColorHex]     = @ColorHex,
            [CategoryType] = @CategoryType,
            [UpdatedBy]    = @RequestedBy,
            [UpdatedOn]    = @Now
        WHERE [Id] = @Id AND [UserId] = @RequestedBy AND [IsDeleted] = 0;

        -- Audit Log
        INSERT INTO [dbo].[CategoryAuditLog] ([CategoryId], [UserId], [Name], [Icon], [ColorHex], [CategoryType], [Action], [ActionOn], [ActionBy])
        VALUES (@Id, @RequestedBy, @Name, @Icon, @ColorHex, @CategoryType, 'UPDATE', @Now, @RequestedBy);

        SELECT 1 AS [Status], 'CATEGORY_SAVE_SUCCESS' AS [MessageCode], @Id AS [CategoryId];
    END

    -- Return updated list in second result set (R23)
    EXEC [dbo].[PRO_GetCategoryList]
        @RequestedBy  = @RequestedBy,
        @SessionToken = @SessionToken,
        @CategoryType = 0;
END
GO
