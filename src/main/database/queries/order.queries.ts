export const getAllOrdersQuery =  `
  SELECT * FROM v_UserOrders ORDER BY OrderDate DESC
`;

export const updateOrderStatusQuery =  `
  UPDATE Orders SET Status = @status WHERE OrderID = @id
`;
