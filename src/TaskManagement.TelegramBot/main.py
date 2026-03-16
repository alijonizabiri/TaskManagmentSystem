import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
SESSIONS_PATH = DATA_DIR / "sessions.json"


def load_env():
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


load_env()

BOT_TOKEN = os.environ.get("BOT_TOKEN", "").strip()
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:5271").rstrip("/")
POLLING_TIMEOUT = int(os.environ.get("POLLING_TIMEOUT", "30"))
TELEGRAM_API_BASE = f"https://api.telegram.org/bot{BOT_TOKEN}"
MAIN_MENU = {
    "keyboard": [
        [{"text": "My Tasks"}, {"text": "Me"}],
        [{"text": "Logout"}],
    ],
    "resize_keyboard": True,
}


def ensure_data_dir():
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_sessions():
    ensure_data_dir()
    if not SESSIONS_PATH.exists():
        return {}

    try:
        return json.loads(SESSIONS_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_sessions(sessions):
    ensure_data_dir()
    SESSIONS_PATH.write_text(json.dumps(sessions, ensure_ascii=True, indent=2), encoding="utf-8")


def telegram_request(method, payload=None, query=None):
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN is not configured.")

    url = f"{TELEGRAM_API_BASE}/{method}"
    if query:
        url = f"{url}?{urllib.parse.urlencode(query)}"

    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = urllib.request.Request(url, data=data, headers=headers, method="POST" if data else "GET")
    with urllib.request.urlopen(request, timeout=POLLING_TIMEOUT + 10) as response:
        body = response.read().decode("utf-8")
        return json.loads(body)


def api_request(method, path, payload=None, token=None):
    url = f"{API_BASE_URL}{path}"
    data = None
    headers = {"Content-Type": "application/json"}

    if token:
        headers["Authorization"] = f"Bearer {token}"

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(url, data=data, headers=headers, method=method.upper())

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        try:
            parsed = json.loads(body) if body else {}
        except json.JSONDecodeError:
            parsed = {"message": body or f"HTTP {exc.code}"}
        return exc.code, parsed


def send_message(chat_id, text, reply_markup=None):
    payload = {"chat_id": chat_id, "text": text}
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup
    telegram_request("sendMessage", payload=payload)


def answer_callback_query(callback_query_id):
    telegram_request("answerCallbackQuery", payload={"callback_query_id": callback_query_id})


def normalize_username(username):
    if not username:
        return None
    normalized = username.strip().lstrip("@").lower()
    return normalized or None


def get_message_username(message):
    sender = message.get("from") or {}
    chat = message.get("chat") or {}
    return normalize_username(sender.get("username") or chat.get("username"))


def get_session(sessions, chat_id):
    return sessions.get(str(chat_id))


def set_session(sessions, chat_id, auth_response):
    sessions[str(chat_id)] = {
        "token": auth_response["token"],
        "user_id": auth_response["userId"],
        "full_name": auth_response["fullName"],
        "email": auth_response["email"],
        "role": auth_response["role"],
        "saved_at": datetime.utcnow().isoformat() + "Z",
    }
    save_sessions(sessions)


def clear_session(sessions, chat_id):
    sessions.pop(str(chat_id), None)
    save_sessions(sessions)


def try_auto_login_by_username(sessions, chat_id, telegram_username):
    if not telegram_username:
        return False, "Telegram username not found in this chat."

    status, response = api_request(
        "POST",
        "/auth/telegram-bot/username-login",
        payload={"chatId": chat_id, "telegramUsername": telegram_username},
    )

    if status != 200:
        message = response.get("message") or "Auto-login failed."
        return False, message

    set_session(sessions, chat_id, response)
    return True, f"Signed in as {response['fullName']}."


def login_with_credentials(sessions, chat_id, telegram_username, email, password):
    status, response = api_request(
        "POST",
        "/auth/telegram-bot/login",
        payload={
            "email": email,
            "password": password,
            "chatId": chat_id,
            "telegramUsername": telegram_username,
        },
    )

    if status != 200:
        return False, response.get("message") or "Login failed."

    set_session(sessions, chat_id, response)
    return True, f"Signed in as {response['fullName']}."


def fetch_my_tasks(session):
    status, response = api_request("GET", "/tasks/my", token=session["token"])
    if status != 200:
        return False, response.get("message") or "Could not fetch tasks."

    return True, response


def fetch_task_details(session, task_id):
    status, response = api_request("GET", f"/tasks/{task_id}", token=session["token"])
    if status != 200:
        return False, response.get("message") or "Could not fetch task details."

    return True, response


def format_tasks(tasks):
    if not tasks:
        return "You have no assigned tasks."

    lines = ["My tasks:"]
    for task in tasks[:10]:
        deadline = task.get("deadline") or "no deadline"
        lines.append(f"- {task['title']}")
        lines.append(f"  Status: {task['status']} | Priority: {task['priority']}")
        lines.append(f"  Deadline: {deadline}")

    if len(tasks) > 10:
        lines.append("Showing first 10 tasks.")

    return "\n".join(lines)


def build_tasks_keyboard(tasks):
    buttons = []
    for task in tasks[:10]:
        buttons.append([{"text": task["title"][:50], "callback_data": f"task:{task['id']}"}])

    if tasks:
        buttons.append([{"text": "Refresh", "callback_data": "tasks:refresh"}])

    return {"inline_keyboard": buttons}


def format_task_details(task):
    deadline = task.get("deadline") or "no deadline"
    description = task.get("description") or "No description"
    assignee = task.get("assigneeName") or "Unassigned"

    return "\n".join(
        [
            task["title"],
            f"Status: {task['status']}",
            f"Priority: {task['priority']}",
            f"Assignee: {assignee}",
            f"Deadline: {deadline}",
            f"Description: {description}",
        ]
    )


def format_me(session):
    return "\n".join(
        [
            "Current account:",
            f"Name: {session['full_name']}",
            f"Email: {session['email']}",
            f"Role: {session['role']}",
        ]
    )


def send_main_menu(chat_id, text):
    send_message(chat_id, text, reply_markup=MAIN_MENU)


def ensure_session(sessions, chat_id, telegram_username):
    session = get_session(sessions, chat_id)
    if session:
        return True, session

    success, result_message = try_auto_login_by_username(sessions, chat_id, telegram_username)
    if not success:
        return False, result_message

    return True, get_session(sessions, chat_id)


def show_tasks(sessions, chat_id, telegram_username):
    success, session_or_message = ensure_session(sessions, chat_id, telegram_username)
    if not success:
        send_main_menu(chat_id, "You are not signed in. Use /login email password first.")
        return

    success, payload = fetch_my_tasks(session_or_message)
    if not success:
        send_main_menu(chat_id, payload)
        return

    reply_markup = build_tasks_keyboard(payload) if payload else MAIN_MENU
    send_message(chat_id, format_tasks(payload), reply_markup=reply_markup)


def handle_callback(sessions, callback_query):
    callback_id = callback_query.get("id")
    data = callback_query.get("data") or ""
    message = callback_query.get("message") or {}
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    sender = callback_query.get("from") or {}
    telegram_username = normalize_username(sender.get("username"))

    if callback_id:
        answer_callback_query(callback_id)

    if not chat_id:
        return

    success, session_or_message = ensure_session(sessions, chat_id, telegram_username)
    if not success:
        send_main_menu(chat_id, "You are not signed in. Use /login email password first.")
        return

    session = session_or_message

    if data == "tasks:refresh":
        success, payload = fetch_my_tasks(session)
        if not success:
            send_main_menu(chat_id, payload)
            return

        reply_markup = build_tasks_keyboard(payload) if payload else MAIN_MENU
        send_message(chat_id, format_tasks(payload), reply_markup=reply_markup)
        return

    if data.startswith("task:"):
        task_id = data.split(":", 1)[1]
        success, payload = fetch_task_details(session, task_id)
        if not success:
            send_main_menu(chat_id, payload)
            return

        send_message(
            chat_id,
            format_task_details(payload),
            reply_markup={"inline_keyboard": [[{"text": "Back to My Tasks", "callback_data": "tasks:refresh"}]]},
        )


def handle_command(sessions, message):
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    text = (message.get("text") or "").strip()
    telegram_username = get_message_username(message)

    if not chat_id or not text:
        return

    if text.startswith("/start"):
        session = get_session(sessions, chat_id)
        if session:
            send_main_menu(chat_id, "Session already active.")
            return

        success, result_message = try_auto_login_by_username(sessions, chat_id, telegram_username)
        if success:
            send_main_menu(chat_id, result_message)
            return

        send_main_menu(
            chat_id,
            "Commands:\n"
            "/login email password - sign in once\n"
            "/my_tasks - show my assigned tasks\n"
            "/me - show my current account\n"
            "/logout - clear local bot session\n\n"
            "If admin linked your Telegram username in the system, /start will auto-login you.",
        )
        return

    if text.startswith("/login"):
        parts = text.split(" ", 2)
        if len(parts) != 3:
            send_main_menu(chat_id, "Usage: /login email password")
            return

        email = parts[1].strip()
        password = parts[2].strip()
        success, result_message = login_with_credentials(sessions, chat_id, telegram_username, email, password)
        send_main_menu(chat_id, result_message)
        return

    if text.startswith("/my_tasks") or text == "My Tasks":
        show_tasks(sessions, chat_id, telegram_username)
        return

    if text.startswith("/me") or text == "Me":
        session = get_session(sessions, chat_id)
        if not session:
            send_main_menu(chat_id, "You are not signed in. Use /login email password first.")
            return

        send_main_menu(chat_id, format_me(session))
        return

    if text.startswith("/logout") or text == "Logout":
        clear_session(sessions, chat_id)
        send_main_menu(chat_id, "Session cleared.")
        return

    send_main_menu(chat_id, "Unknown command. Use /start.")


def run():
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN is missing. Configure it in .env or environment variables.")

    sessions = load_sessions()
    offset = 0

    while True:
        try:
            response = telegram_request(
                "getUpdates",
                query={"timeout": POLLING_TIMEOUT, "offset": offset},
            )

            for update in response.get("result", []):
                offset = update["update_id"] + 1
                message = update.get("message")
                if message:
                    handle_command(sessions, message)
                callback_query = update.get("callback_query")
                if callback_query:
                    handle_callback(sessions, callback_query)
        except KeyboardInterrupt:
            break
        except Exception as exc:
            print(f"[bot] error: {exc}")
            time.sleep(5)


if __name__ == "__main__":
    run()
