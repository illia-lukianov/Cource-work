export const findUserByEmailQuery = /* sql */ `
  SELECT * FROM Users WHERE Email = @email
`;

export const getLastUserIdQuery = /* sql */ `
  SELECT TOP 1 UserID FROM Users ORDER BY UserID DESC
`;

export const insertUserQuery = /* sql */ `
  INSERT INTO Users (FullName, Email, PasswordHash, Role)
  VALUES (@name, @email, @pass, 'User')
`;