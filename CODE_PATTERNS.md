# Code Patterns and Best Practices

## Database Access Pattern

Always pass the current user role to `connectDB()` with a fallback to `User`:

```ts
const pool = await connectDB(UserRepository.getUserRole() ?? "User");
```

This guarantees that user requests use the correct SQL credentials.

## Error Handling

Wrap all database operations in `try/catch` blocks:

```ts
try {
  const pool = await connectDB(...);
  const result = await pool.request().query(query);
  return result.recordset;
} catch (err) {
  console.error("[BOOK] Error fetching books:", err);
  return [];
}
```

## Logging Standards

Use descriptive logging with a prefix for the module:

- `[AUTH]` for authentication and session logic
- `[BOOK]` for book-related operations
- `[ORDER]` for order-related operations
- `[CATEGORY]` for category logic
- `[REPORT]` for reports

## Naming Conventions

- Use descriptive variable names like `currentUser`, `userRole`, `dbPool`.
- Keep constant names in upper case: `USER_STORAGE_KEY`.

## localStorage Usage

Store only public user data in localStorage:

```ts
localStorage.setItem("bookstore_user", JSON.stringify({
  id: user.id,
  name: user.name,
  role: user.role,
  email: user.email,
  timestamp: new Date().toISOString(),
}));
```

## API Responses

Standardize response objects:

```ts
return { success: true, data: result.recordset };
return { success: false, message: "Error description" };
```

## Preload API

Expose only safe methods to the renderer:

```ts
window.api = {
  login,
  logout,
  validateSession,
  getCurrentUser,
  isAdmin,
  getUserRole,
};
```
