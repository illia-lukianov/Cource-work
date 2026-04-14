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

export const getPriceAnalysisQuery = `
  SELECT 
      b.Title AS BookTitle,
      pcl.OldPrice,
      pcl.NewPrice,
      pcl.ChangeDate
  FROM PriceChangeLogs pcl
  INNER JOIN Books b ON pcl.BookID = b.BookID
  ORDER BY pcl.ChangeDate DESC
`;
