GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_DeleteTransaction
    @Id           = 1,
    @RequestedBy  = 1,
    @SessionToken = 'jwt-session-guid',
    @PageNo       = 1,
    @PageSize     = 20;
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_DeleteTransaction]
    @Id           BIGINT       = 0,
    @RequestedBy  BIGINT       = 0,
    @SessionToken VARCHAR(500) = '',
    @PageNo       INT          = 1,
    @PageSize     INT          = 20
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.FN_Authorize(@RequestedBy, @SessionToken, '{}') = 0
    BEGIN
        SELECT 0 AS [Status], 'AUTH_SESSION_EXPIRED' AS [MessageCode];
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM [dbo].[Transaction] WHERE [Id] = @Id AND [UserId] = @RequestedBy AND [IsDeleted] = 0)
    BEGIN
        SELECT 0 AS [Status], 'TRANSACTION_NOT_FOUND' AS [MessageCode];
        RETURN;
    END

    DECLARE @Now DATETIME = GETUTCDATE();

    -- Soft delete
    UPDATE [dbo].[Transaction]
    SET [IsDeleted] = 1,
        [IsActive]  = 0,
        [UpdatedBy] = @RequestedBy,
        [UpdatedOn] = @Now
    WHERE [Id] = @Id AND [UserId] = @RequestedBy;

    -- Audit Log
    INSERT INTO [dbo].[TransactionAuditLog] ([TransactionId], [UserId], [Action], [ActionOn], [ActionBy])
    VALUES (@Id, @RequestedBy, 'SOFTDELETE', @Now, @RequestedBy);

    SELECT 1 AS [Status], 'TRANSACTION_DELETE_SUCCESS' AS [MessageCode];

    -- Return updated list in second result set (R23)
    EXEC [dbo].[PRO_GetTransactionList]
        @RequestedBy     = @RequestedBy,
        @SessionToken    = @SessionToken,
        @FromDate        = NULL,
        @ToDate          = NULL,
        @CategoryId      = 0,
        @AccountId       = 0,
        @TransactionType = 0,
        @Keyword         = N'',
        @PageNo          = @PageNo,
        @PageSize        = @PageSize;
END
GO
