# Fixes Summary

## April 25, 2026

### Issue
Users were connecting to the database with the wrong credentials and sometimes using the admin account.

### Fixes

- Added explicit role-based connection handling in `connectDB()`.
- Ensured `UserRepository.validateUser()` reconnects with the appropriate role.
- Added localStorage session persistence for automatic reuse.
- Added session validation on startup to avoid stale or invalid sessions.
