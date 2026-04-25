export const getBookDetailsQuery = /* sql */ `
  SELECT * FROM v_BookDetails ORDER BY Title
`;

export const getBookForUsersQuery = /* sql */ `
  SELECT b.*, s.Quantity FROM Books b JOIN Stock s ON b.BookID = s.BookID ORDER BY Title
`;

export const deleteBookByIdQuery = /* sql */ `
  DELETE FROM Books WHERE BookID = @id
`;