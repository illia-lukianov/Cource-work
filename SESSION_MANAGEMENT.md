# Session Management

## Overview

This document describes how the application manages user sessions.

## Login Flow

1. User enters email and password.
2. The main process validates credentials.
3. The user role is read from the database.
4. A database connection is established with the role-specific credentials.
5. User data is stored in localStorage under `bookstore_user`.

## Session Restore

- On app startup, `Login.tsx` checks for an existing saved session.
- If a session exists, it calls `window.api.validateSession()`.
- The main process validates the session with the database.
- If the session is still valid, the user is redirected.
- Invalid sessions are cleared from localStorage.

## localStorage Format

```json
{
  "id": 1,
  "name": "Jane Doe",
  "role": "Admin",
  "email": "jane@example.com",
  "timestamp": "2026-04-26T12:00:00.000Z"
}
```

## Logout

- Clears the current user from memory.
- Removes the saved user from localStorage.
- Deletes the session file from the main process.
