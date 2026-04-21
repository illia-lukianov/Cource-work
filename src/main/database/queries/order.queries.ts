export const getAllOrdersQuery = /* sql */ `
  SELECT * FROM v_UserOrders ORDER BY OrderDate DESC
`;

export const updateOrderStatusQuery = /* sql */ `
  UPDATE Orders SET Status = @status WHERE OrderID = @id
`;
