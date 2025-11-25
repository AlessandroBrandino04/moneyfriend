# Notifications service test client

This small Node.js test client connects to the `notifications-service` via Socket.IO using a JWT token, listens for realtime notifications, and allows simple HTTP interactions with the REST API.

Setup

1. Open a terminal in `services/notifications-service/test-client`.
2. Copy `.env.example` to `.env` and edit as needed (or set env vars directly).
3. Install dependencies:

```powershell
cd services\notifications-service\test-client
npm install
```

Run

```powershell
# from repo root
cd services\notifications-service\test-client
npm start
```

Environment variables (see `.env.example`):
- `JWT_SECRET` – optional; if provided the client will sign a token with `sub=TEST_USER_ID`.
- `TEST_JWT` – optional; if provided it will be used directly instead of signing.
- `TEST_USER_ID` – default `1`.
- `NOTIFICATIONS_URL` – default `http://localhost:6000`.

Usage (interactive commands):
- `pub <type> <message>` – publish a notification for `TEST_USER_ID`.
- `list` – list all notifications (requires JWT).
- `listunread` – list only unread notifications.
- `mark <id>` – mark notification id as read.
- `exit` – quit.

Notes

- The client will either use `TEST_JWT` env var or will sign a JWT using `JWT_SECRET`. Make sure the token is valid for the `notifications-service` (it must be signed with the same `JWT_SECRET`).
- By default the client connects to `http://localhost:6000` which is the default port of the `notifications-service` in docker-compose.
