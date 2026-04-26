-- ===================================================
-- ТАБЛИЦІ БД З CHAR ID (ВСІ ID - CHAR(10))
-- ===================================================

-- 1. ТАБЛИЦЯ КОРИСТУВАЧІВ (Users)
IF OBJECT_ID('Users', 'U') IS NOT NULL
    DROP TABLE Users;
GO

CREATE TABLE Users
(
    UserID CHAR(10) PRIMARY KEY,
    FullName NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Role NVARCHAR(50) DEFAULT 'User'
);
GO

-- 2. ТАБЛИЦЯ КАТЕГОРІЙ (Categories)
IF OBJECT_ID('Categories', 'U') IS NOT NULL
    DROP TABLE Categories;
GO

CREATE TABLE Categories
(
    CategoryID CHAR(10) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL UNIQUE
);
GO

-- 3. ТАБЛИЦЯ КНИГ (Books)
IF OBJECT_ID('Books', 'U') IS NOT NULL
    DROP TABLE Books;
GO

CREATE TABLE Books
(
    BookID CHAR(10) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Author NVARCHAR(255) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    CategoryID CHAR(10) NOT NULL,
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID) ON DELETE CASCADE
);
GO

-- 4. ТАБЛИЦЯ СКЛАДУ (Stock)
IF OBJECT_ID('Stock', 'U') IS NOT NULL
    DROP TABLE Stock;
GO

CREATE TABLE Stock
(
    StockID CHAR(10) PRIMARY KEY,
    BookID CHAR(10) NOT NULL UNIQUE,
    Quantity INT DEFAULT 0,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE
);
GO

-- 5. ТАБЛИЦЯ ЗАМОВЛЕНЬ (Orders)
IF OBJECT_ID('Orders', 'U') IS NOT NULL
    DROP TABLE Orders;
GO

CREATE TABLE Orders
(
    OrderID CHAR(10) PRIMARY KEY,
    UserID CHAR(10) NOT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    FinalAmount DECIMAL(10, 2) NOT NULL,
    Status NVARCHAR(50) DEFAULT 'pending',
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

-- 6. ТАБЛИЦЯ ПОЗИЦІЙ ЗАМОВЛЕННЯ (OrderItems)
IF OBJECT_ID('OrderItems', 'U') IS NOT NULL
    DROP TABLE OrderItems;
GO

CREATE TABLE OrderItems
(
    OrderItemID CHAR(10) PRIMARY KEY,
    OrderID CHAR(10) NOT NULL,
    BookID CHAR(10) NOT NULL,
    Quantity INT NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE
);
GO

-- 7. ТАБЛИЦЯ РЕЦЕНЗІЙ (Reviews)
IF OBJECT_ID('Reviews', 'U') IS NOT NULL
    DROP TABLE Reviews;
GO

CREATE TABLE Reviews
(
    ReviewID CHAR(10) PRIMARY KEY,
    BookID CHAR(10) NOT NULL,
    UserID CHAR(10) NOT NULL,
    Rating INT CHECK (Rating >= 1 AND Rating <= 5),
    Comment NVARCHAR(MAX),
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

-- 8. ТАБЛИЦЯ ЛОГІВ ЗМІН ЦІН (PriceChangeLogs)
IF OBJECT_ID('PriceChangeLogs', 'U') IS NOT NULL
    DROP TABLE PriceChangeLogs;
GO

CREATE TABLE PriceChangeLogs
(
    LogID CHAR(10) PRIMARY KEY,
    BookID CHAR(10) NOT NULL,
    OldPrice DECIMAL(10, 2),
    NewPrice DECIMAL(10, 2) NOT NULL,
    ChangeDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE
);
GO

-- ===================================================
-- ТАБЛИЦЯ ДЛЯ АВТОІНКРЕМЕНТУ CHAR ID
-- ===================================================

IF OBJECT_ID('IDSequence', 'U') IS NOT NULL
    DROP TABLE IDSequence;
GO

CREATE TABLE IDSequence
(
    TableName NVARCHAR(50) PRIMARY KEY,
    NextValue INT DEFAULT 1
);
GO

-- Ініціалізація послідовностей для кожної таблиці
INSERT INTO IDSequence
    (TableName, NextValue)
VALUES
    ('Users', 1);
INSERT INTO IDSequence
    (TableName, NextValue)
VALUES
    ('Books', 1);
INSERT INTO IDSequence
    (TableName, NextValue)
VALUES
    ('Categories', 1);
INSERT INTO IDSequence
    (TableName, NextValue)
VALUES
    ('Orders', 1);
INSERT INTO IDSequence
    (TableName, NextValue)
VALUES
    ('OrderItems', 1);
INSERT INTO IDSequence
    (TableName, NextValue)
VALUES
    ('Reviews', 1);
INSERT INTO IDSequence
    (TableName, NextValue)
VALUES
    ('Stock', 1);
INSERT INTO IDSequence
    (TableName, NextValue)
VALUES
    ('PriceChangeLogs', 1);
GO

-- ===================================================
-- ФУНКЦІЯ ГЕНЕРАЦІЇ CHAR ID
-- ===================================================

IF OBJECT_ID('dbo.fn_GenerateCharID', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_GenerateCharID;
GO

CREATE FUNCTION dbo.fn_GenerateCharID (@TableName NVARCHAR(50), @Prefix NVARCHAR(2))
RETURNS CHAR(10)
AS
BEGIN
    DECLARE @NextValue INT;

    UPDATE IDSequence
    SET NextValue = NextValue + 1
    WHERE TableName = @TableName;

    SELECT @NextValue = NextValue
    FROM IDSequence
    WHERE TableName = @TableName;

    RETURN @Prefix + FORMAT(@NextValue - 1, '0000');
END
GO

-- ===================================================
-- VIEWS (ПРЕДСТАВЛЕННЯ)
-- ===================================================

-- 1. VIEW для деталей книг з агрегованою інформацією
IF OBJECT_ID('v_BookDetails', 'V') IS NOT NULL
    DROP VIEW v_BookDetails;
GO

CREATE VIEW v_BookDetails
AS
    SELECT
        b.BookID AS Id,
        b.Title,
        b.Author,
        b.Price,
        ISNULL(c.Name, N'Без категорії') AS CategoryName,
        ISNULL(s.Quantity, 0) AS TotalStock,
        ISNULL((SELECT SUM(oi.Quantity)
        FROM OrderItems oi
        WHERE oi.BookID = b.BookID), 0) AS TotalSold,
        ISNULL((SELECT SUM(oi.Quantity * oi.Price)
        FROM OrderItems oi
        WHERE oi.BookID = b.BookID), 0) AS TotalRevenue
    FROM Books b
        LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
        LEFT JOIN Stock s ON b.BookID = s.BookID;
GO

-- 2. VIEW для деталей замовлень з інформацією про користувача
IF OBJECT_ID('v_UserOrders', 'V') IS NOT NULL
    DROP VIEW v_UserOrders;
GO

CREATE VIEW v_UserOrders
AS
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

CREATE VIEW v_SalesReport
AS
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

CREATE VIEW v_CustomerReport
AS
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
-- STORED PROCEDURES З CHAR ID АВТОІНКРЕМЕНОМ
-- ===================================================

-- 1. Створення користувача
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
        DECLARE @UserID CHAR(10);
        SET @UserID = dbo.fn_GenerateCharID('Users', 'U');

        INSERT INTO Users
        (UserID, FullName, Email, PasswordHash, Role)
    VALUES
        (@UserID, @FullName, @Email, @PassHash, @Role);

        SELECT @UserID AS UserID, @FullName AS FullName, @Email AS Email, @Role AS Role;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- 2. Створення категорії
IF OBJECT_ID('sp_CreateCategoryWithCharID', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateCategoryWithCharID;
GO

CREATE PROCEDURE sp_CreateCategoryWithCharID
    @Name NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @CategoryID CHAR(10);
        SET @CategoryID = dbo.fn_GenerateCharID('Categories', 'C');

        INSERT INTO Categories
        (CategoryID, Name)
    VALUES
        (@CategoryID, @Name);

        SELECT @CategoryID AS CategoryID, @Name AS Name;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- 3. Створення книги
IF OBJECT_ID('sp_CreateBook', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateBook;
GO

CREATE PROCEDURE sp_CreateBook
    @Title NVARCHAR(255),
    @Author NVARCHAR(255),
    @Price DECIMAL(10,2),
    @CategoryID CHAR(10),
    @Quantity INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @BookID CHAR(10);
        DECLARE @StockID CHAR(10);
        
        SET @BookID = dbo.fn_GenerateCharID('Books', 'B');

        INSERT INTO Books
        (BookID, Title, Author, Price, CategoryID)
    VALUES
        (@BookID, @Title, @Author, @Price, @CategoryID);

        IF @Quantity > 0
        BEGIN
        SET @StockID = dbo.fn_GenerateCharID('Stock', 'S');
        INSERT INTO Stock
            (StockID, BookID, Quantity)
        VALUES
            (@StockID, @BookID, @Quantity);
    END

        SELECT @BookID AS BookID, @Title AS Title, @Author AS Author, @Price AS Price;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- 4. Оновлення книги
IF OBJECT_ID('sp_UpdateBook', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpdateBook;
GO

CREATE PROCEDURE sp_UpdateBook
    @BookID CHAR(10),
    @Title NVARCHAR(255),
    @Author NVARCHAR(255),
    @Price DECIMAL(10,2),
    @CategoryID CHAR(10),
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
        IF EXISTS(SELECT 1
        FROM Stock
        WHERE BookID = @BookID)
            BEGIN
            UPDATE Stock
                SET Quantity = @Quantity
                WHERE BookID = @BookID;
        END
            ELSE
            BEGIN
            DECLARE @StockID CHAR(10);
            SET @StockID = dbo.fn_GenerateCharID('Stock', 'S');
            INSERT INTO Stock
                (StockID, BookID, Quantity)
            VALUES
                (@StockID, @BookID, @Quantity);
        END
    END
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- 5. Створення замовлення
IF OBJECT_ID('sp_CreateOrder', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateOrder;
GO

CREATE PROCEDURE sp_CreateOrder
    @UserID INT,
    @FinalAmount DECIMAL(10,2),
    @ItemsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OrderID INT;

    BEGIN TRY
        INSERT INTO Orders
        (UserID, OrderDate, Status, FinalAmount)
    VALUES
        (@UserID, GETDATE(), 'pending', @FinalAmount);

        SET @OrderID = CAST(SCOPE_IDENTITY() AS INT);

        INSERT INTO OrderItems
        (OrderID, BookID, Quantity, Price)
    SELECT
        @OrderID,
        bookId,
        quantity,
        0
    FROM OPENJSON(@ItemsJson)
        WITH (
            bookId INT '$.bookId',
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

-- 6. Створення рецензії
IF OBJECT_ID('sp_CreateReview', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateReview;
GO

CREATE PROCEDURE sp_CreateReview
    @BookID CHAR(10),
    @UserID CHAR(10),
    @Rating INT,
    @Comment NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @ReviewID CHAR(10);
        SET @ReviewID = dbo.fn_GenerateCharID('Reviews', 'R');

        INSERT INTO Reviews
        (ReviewID, BookID, UserID, Rating, Comment)
    VALUES
        (@ReviewID, @BookID, @UserID, @Rating, @Comment);

        SELECT @ReviewID AS ReviewID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ===================================================
-- ЗАВЕРШЕНО: ВСІ ТАБЛИЦІ СОЗДАНІ З CHAR(10) ID
-- ===================================================
-- Префікси ID:
-- U0001 - Users
-- B0001 - Books
-- C0001 - Categories
-- O0001 - Orders
-- OI0001 - OrderItems
-- R0001 - Reviews
-- S0001 - Stock
-- L0001 - PriceChangeLogs
-- ===================================================
