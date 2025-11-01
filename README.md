# Ambixous

## Environment Variables

Set the following variables in your `.env` file to enable Google-based admin authentication:

- `GOOGLE_CLIENT_ID` – OAuth client ID from the Google Cloud Console.
- `GOOGLE_CLIENT_SECRET` – OAuth client secret paired with the above client ID.
- `NEXTAUTH_SECRET` – Secret used by NextAuth.js to encrypt and sign session data.
- `ADMIN_EMAILS` – Comma-separated list of email addresses that are allowed to sign in as administrators.

Ensure that each email in `ADMIN_EMAILS` matches the administrator's Google account exactly.
