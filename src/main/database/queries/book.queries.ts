export const getBookDetailsQuery =  `
  SELECT * FROM v_BookDetails ORDER BY Title
`;

export const getBookForUsersQuery =  `
  SELECT b.*, s.Quantity FROM Books b JOIN Stock s ON b.BookID = s.BookID ORDER BY Title
`;

export const deleteBookByIdQuery =  `
  DELETE FROM Books WHERE BookID = @id
`;