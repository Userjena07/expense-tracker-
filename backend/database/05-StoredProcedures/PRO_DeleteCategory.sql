GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_DeleteCategory
    @Id           = 1,
    @RequestedBy  = 1,
    @SessionToken = 'jwt-session-guid';
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_DeleteCategory]
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

    IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE [Id] = @Id AND [UserId] = @RequestedBy AND [IsDeleted] = 0)
    BEGIN
        SELECT 0 AS [Status], 'CATEGORY_NOT_FOUND' AS [MessageCode];
        RETURN;
    END

    DECLARE @Now DATETIME = GETUTCDATE();

    -- Soft delete
    UPDATE [dbo].[Category]
    SET [IsDeleted] = 1,
        [IsActive]  = 0,
        [UpdatedBy] = @RequestedBy,
        [UpdatedOn] = @Now
    WHERE [Id] = @Id AND [UserId] = @RequestedBy;

    -- Audit Log
    INSERT INTO [dbo].[CategoryAuditLog] ([CategoryId], [UserId], [Action], [ActionOn], [ActionBy])
    VALUES (@Id, @RequestedBy, 'SOFTDELETE', @Now, @RequestedBy);

    SELECT 1 AS [Status], 'CATEGORY_DELETE_SUCCESS' AS [MessageCode];

    -- Return updated list in second result set (R23)
    EXEC [dbo].[PRO_GetCategoryList]
        @RequestedBy  = @RequestedBy,
        @SessionToken = @SessionToken,
        @CategoryType = 0;
END
GO
