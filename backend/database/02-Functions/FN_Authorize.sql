GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
SELECT dbo.FN_Authorize(1, 'valid-session-token', '{}');
*/
CREATE OR ALTER FUNCTION [dbo].[FN_Authorize]
(
    @RequestedBy  BIGINT,
    @SessionToken NVARCHAR(500),
    @Context      VARCHAR(MAX) = '{}'
)
RETURNS BIT
AS
BEGIN
    -- System / Anonymous internal operations
    IF @RequestedBy = 0
        RETURN 1;

    IF @SessionToken IS NULL OR @SessionToken = N''
        RETURN 0;

    -- Validate user session exists, is active, unrevoked, and not expired
    IF EXISTS (
        SELECT 1 
        FROM [dbo].[UserSession] s
        INNER JOIN [dbo].[User] u ON u.[Id] = s.[UserId]
        WHERE s.[UserId] = @RequestedBy
          AND s.[SessionToken] = @SessionToken
          AND s.[RevokedAt] IS NULL
          AND s.[ExpiresAt] > GETUTCDATE()
          AND u.[IsActive] = 1
          AND u.[IsDeleted] = 0
    )
    BEGIN
        RETURN 1;
    END

    RETURN 0;
END
GO
