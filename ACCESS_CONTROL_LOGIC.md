# Access Control and Session Logic

## Overview

This edocument explains the role-based authntication and session handling architecture implemented in the application.

## Role-Based Database Access

The app uses separate SQL credentials depending on the authenticated user role:

- **Admin**: `ElectronAppAdminLogin`
- **User**: `ElectronAppUserLogin`
- **Default**: fallback credentials from `.env`

This ensures that normal users never connect with admin privileges.

## Authentication Flow

1. User submits email and password on the login screen.
2. The main process validates the credentials with `UserRepository.validateUser()`.
3. The user role is retrieved from the database.
4. The app connects to Azure SQL using the role-specific login.
5. User session data is saved in `localStorage`.

## Session Restore

On application startup, the app attempts to restore the last saved session:

- If session data exists in `localStorage`, the app validates it at the server side.
- If the session is valid, the user is redirected automatically.
- If the session is invalid, the local storage is cleared and the login page is shown.

## Security Principles

- No user uses `sa` unless configured explicitly as the default fallback.
- User session data stored locally excludes sensitive data such as passwords.
- The database connection pool is reused when the role stays the same.
