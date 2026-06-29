# Amir Nazir Node Backend

This is a safe side-by-side Node backend scaffold. It does not replace the Laravel backend yet.

## Current Status

- Laravel remains the live backend.
- React still points to the existing Laravel API.
- This Node app currently exposes only safe starter endpoints.
- No database writes, migrations, or package installs have been done.

## Commands

```powershell
npm run dev
npm run check
```

## Migration Rule

Move APIs one group at a time, test them, then switch the React API URL only after the Node version matches Laravel behavior.
