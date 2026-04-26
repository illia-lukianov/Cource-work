# Quick Reference

## Commands

- Start development: `npm run dev`
- Build production: `npm run build`
- Create installer: `npm run make`

## Important Keys

- `localStorage` key: `bookstore_user`
- User role fallback: `User`
- Admin SQL login: `ElectronAppAdminLogin`
- User SQL login: `ElectronAppUserLogin`

## Useful APIs

- `window.api.login({ username, password })`
- `window.api.validateSession(savedUser)`
- `window.api.logout()`
- `window.api.getCurrentUser()`
- `window.api.isAdmin()`
- `window.api.getUserRole()`
