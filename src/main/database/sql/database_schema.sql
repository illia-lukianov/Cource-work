-- ===================================================
-- VIEWS (ПРЕДСТАВЛЕННЯ) ДЛЯ БАЗИ ДАНИХ
-- ===================================================

-- 1. VIEW для деталей книг з агрегованою інформацією
IF OBJECT_ID('v_BookDetails', 'V') IS NOT NULL
    DROP VIEW v_BookDetails;
GO

CREATE VIEW v_BookDetails AS
SELECT 
    b.BookID AS Id,
    b.Title,
    b.Author,
    b.Price,
    ISNULL(c.Name, N'Без категорії') AS CategoryName,
    ISNULL((SELECT SUM(Quantity) FROM Stock s WHERE s.BookID = b.BookID), 0) AS TotalStock,
    ISNULL((SELECT SUM(oi.Quantity) FROM OrderItems oi WHERE oi.BookID = b.BookID), 0) AS TotalSold,
    ISNULL((SELECT SUM(oi.Quantity * oi.Price) FROM OrderItems oi WHERE oi.BookID = b.BookID), 0) AS TotalRevenue
FROM Books b
LEFT JOIN Categories c ON b.CategoryID = c.CategoryID;
GO

-- 2. VIEW для деталей замовлень з інформацією про користувача
IF OBJECT_ID('v_UserOrders', 'V') IS NOT NULL
    DROP VIEW v_UserOrders;
GO

CREATE VIEW v_UserOrders AS
SELECT 
    o.OrderID,
    o.UserID,
    u.FullName,
    u.Email,
    o.OrderDate,
    o.FinalAmount,
    o.Status,
    COUNT(oi.OrderItemID) AS ItemCount
FROM Orders o
LEFT JOIN Users u ON o.UserID = u.UserID
LEFT JOIN OrderItems oi ON o.OrderID = oi.OrderID
GROUP BY o.OrderID, o.UserID, u.FullName, u.Email, o.OrderDate, o.FinalAmount, o.Status;
GO

-- 3. VIEW для звіту про продажі
IF OBJECT_ID('v_SalesReport', 'V') IS NOT NULL
    DROP VIEW v_SalesReport;
GO

CREATE VIEW v_SalesReport AS
SELECT 
    b.Title AS BookTitle,
    c.Name AS CategoryName,
    COUNT(oi.OrderItemID) AS CopiesSold,
    ISNULL(SUM(oi.Quantity * oi.Price), 0) AS GeneratedRevenue
FROM Books b
LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
LEFT JOIN OrderItems oi ON b.BookID = oi.BookID
GROUP BY b.BookID, b.Title, c.Name;
GO

-- 4. VIEW для звіту про клієнтів
IF OBJECT_ID('v_CustomerReport', 'V') IS NOT NULL
    DROP VIEW v_CustomerReport;
GO

CREATE VIEW v_CustomerReport AS
SELECT 
    u.UserID,
    u.FullName,
    u.Email,
    COUNT(DISTINCT o.OrderID) AS TotalOrders,
    ISNULL(SUM(o.FinalAmount), 0) AS TotalSpent
FROM Users u
LEFT JOIN Orders o ON u.UserID = o.UserID
GROUP BY u.UserID, u.FullName, u.Email;
GO

-- ===================================================
-- ТАБЛИЦЯ ДЛЯ АВТОІНКРЕМЕНТУ CHAR ID
-- ===================================================

IF OBJECT_ID('IDSequence', 'U') IS NOT NULL
    DROP TABLE IDSequence;
GO

CREATE TABLE IDSequence (
    TableName NVARCHAR(50) PRIMARY KEY,
    NextValue INT DEFAULT 1
);
GO

-- Ініціалізація значень для кожної таблиці
INSERT INTO IDSequence (TableName, NextValue) VALUES ('Users', 1);
INSERT INTO IDSequence (TableName, NextValue) VALUES ('Books', 1);
INSERT INTO IDSequence (TableName, NextValue) VALUES ('Categories', 1);
INSERT INTO IDSequence (TableName, NextValue) VALUES ('Orders', 1);
INSERT INTO IDSequence (TableName, NextValue) VALUES ('OrderItems', 1);
GO

-- ===================================================
-- ФУНКЦІЯ ГЕНЕРАЦІЇ CHAR ID
-- ===================================================

IF OBJECT_ID('fn_GenerateCharID', 'FN') IS NOT NULL
    DROP FUNCTION fn_GenerateCharID;
GO

CREATE FUNCTION fn_GenerateCharID (@TableName NVARCHAR(50), @Prefix NVARCHAR(2))
RETURNS NVARCHAR(10)
AS
BEGIN
    DECLARE @NextValue INT;
    
    UPDATE IDSequence
    SET NextValue = NextValue + 1
    WHERE TableName = @TableName;
    
    SELECT @NextValue = NextValue FROM IDSequence WHERE TableName = @TableName;
    
    RETURN @Prefix + FORMAT(@NextValue - 1, '0000');
END
GO

-- ===================================================
-- STORED PROCEDURES - ТІЛЬКИ СКЛАДНА ЛОГІКА
-- ===================================================

-- 1. Процедура для створення книги з CHAR ID та Stock
IF OBJECT_ID('sp_CreateBook', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateBook;
GO

CREATE PROCEDURE sp_CreateBook
    @Title NVARCHAR(255),
    @Author NVARCHAR(255),
    @Price DECIMAL(10,2),
    @CategoryID NVARCHAR(10),
    @Quantity INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @BookID NVARCHAR(10);
        SET @BookID = dbo.fn_GenerateCharID('Books', 'B');

        INSERT INTO Books (BookID, Title, Author, Price, CategoryID)
        VALUES (@BookID, @Title, @Author, @Price, @CategoryID);

        IF @Quantity > 0
        BEGIN
            INSERT INTO Stock (BookID, Quantity)
            VALUES (@BookID, @Quantity);
        END

        SELECT @BookID AS BookID, @Title AS Title, @Author AS Author, @Price AS Price;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- 2. Процедура для оновлення книги з логікою Stock
IF OBJECT_ID('sp_UpdateBook', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpdateBook;
GO

CREATE PROCEDURE sp_UpdateBook
    @BookID NVARCHAR(10),
    @Title NVARCHAR(255),
    @Author NVARCHAR(255),
    @Price DECIMAL(10,2),
    @CategoryID NVARCHAR(10),
    @Quantity INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE Books
        SET Title = @Title,
            Author = @Author,
            Price = @Price,
            CategoryID = @CategoryID
        WHERE BookID = @BookID;

        IF @Quantity >= 0
        BEGIN
            UPDATE Stock
            SET Quantity = @Quantity
            WHERE BookID = @BookID;
        END
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- 3. Процедура для створення замовлення з JSON парсингом та CHAR ID
IF OBJECT_ID('sp_CreateOrder', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateOrder;
GO

CREATE PROCEDURE sp_CreateOrder
    @UserID NVARCHAR(10),
    @FinalAmount DECIMAL(10,2),
    @ItemsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OrderID NVARCHAR(10);

    BEGIN TRY
        SET @OrderID = dbo.fn_GenerateCharID('Orders', 'O');

        INSERT INTO Orders (OrderID, UserID, OrderDate, Status, FinalAmount)
        VALUES (@OrderID, @UserID, GETDATE(), 'pending', @FinalAmount);

        INSERT INTO OrderItems (OrderItemID, OrderID, BookID, Quantity, Price)
        SELECT 
            dbo.fn_GenerateCharID('OrderItems', 'OI'),
            @OrderID,
            bookId,
            quantity,
            0
        FROM OPENJSON(@ItemsJson)
        WITH (
            bookId NVARCHAR(10) '$.bookId',
            quantity INT '$.quantity'
        );

        UPDATE oi
        SET oi.Price = b.Price
        FROM OrderItems oi
        JOIN Books b ON oi.BookID = b.BookID
        WHERE oi.OrderID = @OrderID;

        SELECT @OrderID AS OrderID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- 4. Процедура для створення користувача з CHAR ID
IF OBJECT_ID('sp_CreateUserWithCharID', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateUserWithCharID;
GO

CREATE PROCEDURE sp_CreateUserWithCharID
    @FullName NVARCHAR(255),
    @Email NVARCHAR(255),
    @PassHash NVARCHAR(MAX),
    @Role NVARCHAR(50) = 'User'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @UserID NVARCHAR(10);
        SET @UserID = dbo.fn_GenerateCharID('Users', 'U');

        INSERT INTO Users (UserID, FullName, Email, PasswordHash, Role)
        VALUES (@UserID, @FullName, @Email, @PassHash, @Role);

        SELECT @UserID AS UserID, @FullName AS FullName, @Email AS Email, @Role AS Role;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- 5. Процедура для створення категорії з CHAR ID
IF OBJECT_ID('sp_CreateCategoryWithCharID', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateCategoryWithCharID;
GO

CREATE PROCEDURE sp_CreateCategoryWithCharID
    @Name NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @CategoryID NVARCHAR(10);
        SET @CategoryID = dbo.fn_GenerateCharID('Categories', 'C');

        INSERT INTO Categories (CategoryID, Name)
        VALUES (@CategoryID, @Name);

        SELECT @CategoryID AS CategoryID, @Name AS Name;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
