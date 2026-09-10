"""Read-only access to the FieldFlow analytics mirror.

run() returns rows as dicts, df() returns a printable table, and neither will
execute anything but a single SELECT.

    cd warehouse
    python -c "from db import df; print(df('select count(*) as n from APP_VISIT'))"
"""
import os
import re
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "demo.db")

_SELECT_ONLY = re.compile(r"^\s*select\b", re.IGNORECASE)


def _guard(sql: str) -> str:
    stripped = sql.strip().rstrip(";")
    if ";" in stripped:
        raise ValueError("Only a single statement is allowed.")
    if not _SELECT_ONLY.match(stripped):
        raise ValueError("Only SELECT statements are allowed on the warehouse.")
    return stripped


def run(sql: str) -> list[dict]:
    """Execute a single SELECT and return rows as dicts."""
    query = _guard(sql)
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    try:
        conn.row_factory = sqlite3.Row
        return [dict(r) for r in conn.execute(query).fetchall()]
    finally:
        conn.close()


def df(sql: str) -> str:
    """Execute a single SELECT and return an aligned text table."""
    rows = run(sql)
    if not rows:
        return "(0 rows)"
    cols = list(rows[0].keys())
    widths = {c: max(len(c), max(len(str(r[c])) for r in rows)) for c in cols}
    header = "  ".join(c.ljust(widths[c]) for c in cols)
    rule = "  ".join("-" * widths[c] for c in cols)
    body = "\n".join("  ".join(str(r[c]).ljust(widths[c]) for c in cols) for r in rows)
    return f"{header}\n{rule}\n{body}\n({len(rows)} rows)"
