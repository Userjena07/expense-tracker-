GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_GetCategoryById
    @Id           = 1,
    @RequestedBy  = 1,
    @SessionToken = 'jwt-session-guid';
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_GetCategoryById]
    @Id           BIGINT       = 0,
    @RequestedBy  BIGINT       = 0,
    @SessionToken VARCHAR(500) = ''
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.FN_Authorize(@RequestedBy, @SessionToken, '{}') = 0
    BEGIN
        SELECT 0 AS [Status], 'AUTH_SESSION_EXPIRED' AS [MessageCode];
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Category] 
        WHERE [Id] = @Id 
          AND ([UserId] = @RequestedBy OR ([UserId] = 0 AND [IsSystemDefault] = 1)) 
          AND [IsDeleted] = 0
    )
    BEGIN
        SELECT 0 AS [Status], 'CATEGORY_NOT_FOUND' AS [MessageCode];
        RETURN;
    END

    SELECT 1 AS [Status], 'CATEGORY_FOUND' AS [MessageCode];

    SELECT 
        c.[Id],
        c.[UserId],
        c.[Name],
        c.[Icon],
        c.[ColorHex],
        c.[CategoryType],
        c.[IsSystemDefault],
        c.[UpdatedOn],
        c.[IsActive]
    FROM [dbo].[Category] c
    WHERE c.[Id] = @Id AND c.[IsDeleted] = 0;
END
GO
