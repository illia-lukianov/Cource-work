export const getBookDetailsQuery = /* sql */ `
  SELECT * FROM v_BookDetails ORDER BY Title
`;

export const deleteBookByIdQuery = /* sql */ `
  DELETE FROM Books WHERE BookID = @id
`;