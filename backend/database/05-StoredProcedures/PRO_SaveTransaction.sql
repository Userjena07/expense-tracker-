GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
EXEC PRO_SaveTransaction
    @Id              = 0,
    @RequestedBy     = 1,
    @SessionToken    = 'jwt-session-guid',
    @AccountId       = 1,
    @CategoryId      = 1,
    @Amount          = 250.00,
    @TransactionType = 1,
    @TxnDate         = '2026-09-21',
    @Note            = N'Lunch at cafe',
    @TargetAccountId = NULL,
    @ClientTxnId     = 'client-uuid-123';
*/
CREATE OR ALTER PROCEDURE [dbo].[PRO_SaveTransaction]
    @Id              BIGINT        = 0,
    @RequestedBy     BIGINT        = 0,
    @SessionToken    VARCHAR(500)  = '',
    @AccountId       BIGINT        = 0,
    @CategoryId      BIGINT        = 0,
    @Amount          DECIMAL(18,2) = 0,
    @TransactionType TINYINT       = 1, -- 1 Expense, 2 Income, 3 Transfer
    @TxnDate         DATE          = NULL,
    @Note            NVARCHAR(300) = NULL,
    @TargetAccountId BIGINT        = NULL,
    @ClientTxnId     VARCHAR(50)   = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.FN_Authorize(@RequestedBy, @SessionToken, '{}') = 0
    BEGIN
        SELECT 0 AS [Status], 'AUTH_SESSION_EXPIRED' AS [MessageCode];
        RETURN;
    END

    -- Validate Account
    IF NOT EXISTS (SELECT 1 FROM [dbo].[Account] WHERE [Id] = @AccountId AND [UserId] = @RequestedBy AND [IsDeleted] = 0)
    BEGIN
        SELECT 0 AS [Status], 'ACCOUNT_NOT_FOUND' AS [MessageCode];
        RETURN;
    END

    -- Validate Category
    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Category] 
        WHERE [Id] = @CategoryId 
          AND ([UserId] = @RequestedBy OR ([UserId] = 0 AND [IsSystemDefault] = 1)) 
          AND [IsDeleted] = 0
    )
    BEGIN
        SELECT 0 AS [Status], 'CATEGORY_NOT_FOUND' AS [MessageCode];
        RETURN;
    END

    -- Validate Transfer Target Account if Transfer type
    IF @TransactionType = 3
    BEGIN
        IF @TargetAccountId IS NULL OR @TargetAccountId = @AccountId
        BEGIN
            SELECT 0 AS [Status], 'TRANSACTION_INVALID_TRANSFER_ACCOUNT' AS [MessageCode];
            RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM [dbo].[Account] WHERE [Id] = @TargetAccountId AND [UserId] = @RequestedBy AND [IsDeleted] = 0)
        BEGIN
            SELECT 0 AS [Status], 'ACCOUNT_TARGET_NOT_FOUND' AS [MessageCode];
            RETURN;
        END
    END

    IF @TxnDate IS NULL
        SET @TxnDate = CAST(GETUTCDATE() AS DATE);

    DECLARE @Now DATETIME = GETUTCDATE();

    -- Idempotency check with ClientTxnId for INSERT
    IF @Id = 0 AND @ClientTxnId IS NOT NULL AND @ClientTxnId <> ''
    BEGIN
        SELECT @Id = [Id] FROM [dbo].[Transaction] WHERE [ClientTxnId] = @ClientTxnId AND [UserId] = @RequestedBy;
    END

    IF @Id = 0
    BEGIN
        INSERT INTO [dbo].[Transaction] (
            [UserId], [AccountId], [CategoryId], [Amount],
            [TransactionType], [TxnDate], [Note], [TargetAccountId],
            [ClientTxnId], [UpdatedBy], [UpdatedOn], [IsActive], [IsDeleted]
        )
        VALUES (
            @RequestedBy, @AccountId, @CategoryId, @Amount,
            @TransactionType, @TxnDate, @Note, @TargetAccountId,
            @ClientTxnId, @RequestedBy, @Now, 1, 0
        );

        SET @Id = SCOPE_IDENTITY();

        -- Audit Log
        INSERT INTO [dbo].[TransactionAuditLog] ([TransactionId], [UserId], [AccountId], [CategoryId], [Amount], [TransactionType], [TxnDate], [Action], [ActionOn], [ActionBy])
        VALUES (@Id, @RequestedBy, @AccountId, @CategoryId, @Amount, @TransactionType, @TxnDate, 'INSERT', @Now, @RequestedBy);

        SELECT 1 AS [Status], 'TRANSACTION_SAVE_SUCCESS' AS [MessageCode], @Id AS [TransactionId];
    END
    ELSE
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM [dbo].[Transaction] WHERE [Id] = @Id AND [UserId] = @RequestedBy AND [IsDeleted] = 0)
        BEGIN
            SELECT 0 AS [Status], 'TRANSACTION_NOT_FOUND' AS [MessageCode];
            RETURN;
        END

        UPDATE [dbo].[Transaction]
        SET [AccountId]       = @AccountId,
            [CategoryId]      = @CategoryId,
            [Amount]          = @Amount,
            [TransactionType] = @TransactionType,
            [TxnDate]         = @TxnDate,
            [Note]            = @Note,
            [TargetAccountId] = @TargetAccountId,
            [UpdatedBy]       = @RequestedBy,
            [UpdatedOn]       = @Now
        WHERE [Id] = @Id AND [UserId] = @RequestedBy AND [IsDeleted] = 0;

        -- Audit Log
        INSERT INTO [dbo].[TransactionAuditLog] ([TransactionId], [UserId], [AccountId], [CategoryId], [Amount], [TransactionType], [TxnDate], [Action], [ActionOn], [ActionBy])
        VALUES (@Id, @RequestedBy, @AccountId, @CategoryId, @Amount, @TransactionType, @TxnDate, 'UPDATE', @Now, @RequestedBy);

        SELECT 1 AS [Status], 'TRANSACTION_SAVE_SUCCESS' AS [MessageCode], @Id AS [TransactionId];
    END

    -- Return updated transaction list in second result set (R23)
    EXEC [dbo].[PRO_GetTransactionList]
        @RequestedBy     = @RequestedBy,
        @SessionToken    = @SessionToken,
        @FromDate        = NULL,
        @ToDate          = NULL,
        @CategoryId      = 0,
        @AccountId       = 0,
        @TransactionType = 0,
        @Keyword         = N'',
        @PageNo          = 1,
        @PageSize        = 20;
END
GO
