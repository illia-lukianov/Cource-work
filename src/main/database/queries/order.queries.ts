export const getAllOrdersQuery = /* sql */ `
  SELECT o.OrderID, o.OrderDate, o.FinalAmount, o.[Status], u.FullName 
  FROM Orders o 
  LEFT JOIN Users u ON o.UserID = u.UserID
  ORDER BY o.OrderDate DESC
`;

export const updateOrderStatusQuery = /* sql */ `
  UPDATE Orders SET Status = @status WHERE OrderID = @id
`;