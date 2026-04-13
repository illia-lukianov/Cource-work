export const getAllUsersQuery = /* sql */ `
  SELECT UserID, FullName, Email, Role FROM Users
`;

export const deleteUserByIdQuery = /* sql */ `
  DELETE FROM Users WHERE UserID = @id
`;

export const getUserByEmailQuery = /* sql */ `
  SELECT * FROM Users WHERE Email = @email
`;