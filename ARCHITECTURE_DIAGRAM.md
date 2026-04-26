# Architecture Diagram

## Application Layers

- **Renderer**: React UI that handles login, navigation, and display.
- **Preload**: Secure bridge exposing IPC APIs to the renderer.
- **Main**: Electron main process with authentication and IPC handlers.
- **Database Services**: Repositories that query Azure SQL with role-based credentials.

## Data Flow

1. User interacts with the renderer UI.
2. Renderer calls `window.api` methods exposed by `preload.ts`.
3. Preload forwards requests to the main process using IPC.
4. The main process delegates work to repository services.
5. Repository services call `connectDB()` with the current user role.
6. `connectDB()` opens a role-specific SQL connection.

## Connection Roles

- Admin connects using `ElectronAppAdminLogin`.
- User connects using `ElectronAppUserLogin`.
- If no role is available, the app uses the default credentials from `.env`.

## Session Handling

- Login success stores session data in localStorage under `bookstore_user`.
- App startup attempts session validation before showing the login page.
- Invalid sessions are cleared automatically.
