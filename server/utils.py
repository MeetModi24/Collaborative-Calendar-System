# server/utils.py
from datetime import datetime, timezone

def human_readable_delta(dt):
    now = datetime.now(timezone.utc)  # Use UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    delta = now - dt
    seconds = delta.total_seconds()

    if seconds < 0:
        return "in the future"

    intervals = (
        ('year', 31536000),
        ('month', 2592000),
        ('week', 604800),
        ('day', 86400),
        ('hour', 3600),
        ('minute', 60),
        ('second', 1)
    )

    for name, count in intervals:
        value = int(seconds // count)
        if value >= 1:
            return f"{value} {name}{'' if value == 1 else 's'} ago"

    return "Just Now"
