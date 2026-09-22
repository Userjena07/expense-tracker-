IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'ExpenseTrackerDb')
BEGIN
    CREATE DATABASE [ExpenseTrackerDb];
    PRINT 'Database ExpenseTrackerDb created successfully.';
END
ELSE
BEGIN
    PRINT 'Database ExpenseTrackerDb already exists.';
END
GO
