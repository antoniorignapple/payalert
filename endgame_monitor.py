import json
import os
import smtplib
import ssl
import urllib.request
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

API_URL = "https://www.thespacecinema.it/api/microservice/showings/cinemas/1024/films/HO00003836/showingGroups?showingDate=2026-09-24"
STATE_PATH = Path("endgame_state.json")
TO_EMAIL = "antoniorigna2017@gmail.com"


def fetch_json():
    req = urllib.request.Request(
        API_URL,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Referer": "https://www.thespacecinema.it/cinema/casamassima/film/avengers-endgame",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def find_sessions(node, found=None):
    if found is None:
        found = {}
    if isinstance(node, dict):
        sid = node.get("sessionId")
        if sid is not None:
            sid = str(sid)
            attrs = node.get("attributes") or []
            if isinstance(attrs, list):
                attrs = [str(a.get("name") if isinstance(a, dict) else a) for a in attrs]
            elif isinstance(attrs, dict):
                attrs = [str(v) for v in attrs.values()]
            else:
                attrs = [str(attrs)]
            found[sid] = {
                "sessionId": sid,
                "startTime": node.get("startTime"),
                "showTimeWithTimeZone": node.get("showTimeWithTimeZone"),
                "screenName": node.get("screenName"),
                "attributes": sorted(set(a for a in attrs if a and a != "None")),
            }
        for v in node.values():
            find_sessions(v, found)
    elif isinstance(node, list):
        for v in node:
            find_sessions(v, found)
    return found


def fmt(s):
    when = s.get("startTime") or s.get("showTimeWithTimeZone") or "orario n/d"
    screen = s.get("screenName") or "sala n/d"
    attrs = ", ".join(s.get("attributes") or []) or "formato n/d"
    return f"{when} | {screen} | {attrs} | sessione {s['sessionId']}"


def diff(old, new):
    old_ids, new_ids = set(old), set(new)
    added = sorted(new_ids - old_ids)
    removed = sorted(old_ids - new_ids)
    changed = sorted(i for i in old_ids & new_ids if old[i] != new[i])
    return added, removed, changed


def send_email(subject, body):
    user = os.environ.get("SMTP_USERNAME")
    password = os.environ.get("SMTP_APP_PASSWORD")
    if not user or not password:
        raise RuntimeError("Mancano SMTP_USERNAME o SMTP_APP_PASSWORD nei GitHub Actions secrets")
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = user
    msg["To"] = TO_EMAIL
    msg.set_content(body)
    ctx = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ctx) as smtp:
        smtp.login(user, password)
        smtp.send_message(msg)


def main():
    checked = datetime.now(timezone.utc).astimezone().strftime("%d/%m/%Y %H:%M:%S %Z")
    try:
        data = fetch_json()
        current = find_sessions(data)
        if not current:
            raise RuntimeError("API raggiunta ma nessuna sessione trovata nel JSON")
    except Exception as e:
        send_email("Endgame Casamassima - CONTROLLO NON RIUSCITO", f"Controllo: {checked}\n\nErrore: {e}\n\nNon viene dichiarato 'nessun cambiamento' perché la programmazione non è stata letta.")
        raise

    previous = {}
    if STATE_PATH.exists():
        previous = json.loads(STATE_PATH.read_text(encoding="utf-8"))

    added, removed, changed = diff(previous, current)
    infinity = [s for s in current.values() if any("infinity vision" in a.lower() for a in s.get("attributes", []))]

    lines = [f"Controllo: {checked}", f"Sessioni attuali: {len(current)}", ""]
    if previous:
        if added:
            lines.append("NUOVE PROIEZIONI:")
            lines.extend(f"+ {fmt(current[i])}" for i in added)
        else:
            lines.append("Nuove proiezioni: nessuna")
        if removed:
            lines.append("\nPROIEZIONI SCOMPARSE:")
            lines.extend(f"- {fmt(previous[i])}" for i in removed)
        else:
            lines.append("Proiezioni scomparse: nessuna")
        if changed:
            lines.append("\nPROIEZIONI MODIFICATE:")
            for i in changed:
                lines.append(f"* PRIMA: {fmt(previous[i])}")
                lines.append(f"  ORA:   {fmt(current[i])}")
        else:
            lines.append("Modifiche a orario/sala/formato: nessuna")
    else:
        lines.append("Prima esecuzione: baseline inizializzata.")

    lines.append("")
    lines.append("INFINITY VISION: " + ("COMPARSO" if infinity else "NON COMPARSO"))
    if infinity:
        lines.extend(f"! {fmt(s)}" for s in infinity)

    lines.append("\nTUTTE LE PROIEZIONI:")
    for s in sorted(current.values(), key=lambda x: (str(x.get("startTime") or x.get("showTimeWithTimeZone") or ""), x["sessionId"])):
        lines.append(f"- {fmt(s)}")

    for watch_id, label in [("54830", "Sala 5 / biglietto"), ("54716", "Sala 9 21:30 / biglietto")]:
        s = current.get(watch_id)
        lines.append("")
        lines.append(f"{label}: " + (fmt(s) if s else "SESSIONE NON TROVATA"))

    subject = "Endgame Casamassima - "
    if added or removed or changed or infinity:
        subject += "NOVITÀ"
    else:
        subject += "nessun cambiamento"

    send_email(subject, "\n".join(lines))
    STATE_PATH.write_text(json.dumps(current, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


if __name__ == "__main__":
    main()
