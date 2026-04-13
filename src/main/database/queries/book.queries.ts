export const getAllBooksQuery = /* sql */ `
  SELECT 
      b.BookID AS Id,
      b.Title,
      b.Author,
      b.Price,
      ISNULL(c.Name, N'Без категорії') AS CategoryName,
      ISNULL((SELECT SUM(Quantity) FROM Stock s WHERE s.BookID = b.BookID), 0) AS TotalStock,
      ISNULL((SELECT SUM(oi.Quantity) FROM OrderItems oi WHERE oi.BookID = b.BookID), 0) AS TotalSold
  FROM Books b
  LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
`;

export const deleteStockByBookIdQuery = /* sql */ `
  DELETE FROM Stock WHERE BookID = @id
`;

export const deleteBookByIdQuery = /* sql */ `
  DELETE FROM Books WHERE BookID = @id
`;