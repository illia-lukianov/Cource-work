export const getSalesReportQuery = `
  SELECT BookTitle, CategoryName, CopiesSold, GeneratedRevenue 
  FROM v_SalesReport
  ORDER BY GeneratedRevenue DESC
`;

export const getCustomerReportQuery = `
  SELECT FullName, Email, TotalOrders, TotalSpent 
  FROM v_CustomerReport
  ORDER BY TotalSpent DESC
`;