GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_GetCategoryList
    @RequestedBy  = 1,
    @SessionToken = 'jwt-session-guid',
    @CategoryType = 0; -- 0: All, 1: Expense, 2: Income
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_GetCategoryList]
    @RequestedBy  BIGINT       = 0,
    @SessionToken VARCHAR(500) = '',
    @CategoryType TINYINT      = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.FN_Authorize(@RequestedBy, @SessionToken, '{}') = 0
    BEGIN
        SELECT 0 AS [Status], 'AUTH_SESSION_EXPIRED' AS [MessageCode];
        RETURN;
    END

    SELECT 1 AS [Status], 'CATEGORY_LIST_SUCCESS' AS [MessageCode];

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
    WHERE (c.[UserId] = @RequestedBy OR (c.[UserId] = 0 AND c.[IsSystemDefault] = 1))
      AND c.[IsDeleted] = 0
      AND (@CategoryType = 0 OR c.[CategoryType] = @CategoryType)
    ORDER BY c.[CategoryType] ASC, c.[Name] ASC;
END
GO
