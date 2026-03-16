# TaskManagement Telegram Bot

Separate Python bot for the Task Management API.

## Commands

- `/start` - show help and try auto-login by Telegram username if admin linked it
- `/login email password` - sign in once and save session for this chat
- `/my_tasks` - show tasks assigned to the current user
- `/me` - show saved account info
- `/logout` - remove local bot session for this chat

## Setup

1. Copy `.env.example` to `.env`
2. Fill `BOT_TOKEN`
3. Set `API_BASE_URL` to the running API URL
4. Run:

```bash
python main.py
```

## Notes

- If admin sets `TelegramUsername` for a user in the API, `/start` can auto-login that user by Telegram username.
- If no Telegram username is configured, the user can log in once with `/login email password`.
