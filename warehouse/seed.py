"""Regenerate the FieldFlow analytics mirror.

Deterministic: two runs produce the same database.

Standard library only. Run from the repo root with `npm run seed`.
"""
import datetime as dt
import json
import os
import random
import sqlite3

HERE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(HERE, "demo.db")
META_PATH = os.path.join(HERE, "seed-meta.json")

random.seed(20260924)

SEED_END = dt.date(2026, 9, 24)
SEED_START = SEED_END - dt.timedelta(days=30)
REGRESSION_DATE = dt.date(2026, 9, 20)

# Real UTC offsets for these regions in September, when the seed window sits.
REGIONS = [
    ("leeds", "Leeds", "Europe/London", 1, 53.80, -1.55),
    ("munich", "Munich", "Europe/Berlin", 2, 48.14, 11.58),
]

# Local start hours a visit can take. 15:00 is the one the defect removes.
START_HOURS = [9, 11, 13, 15]
DURATION_MIN = 120

FIRST_NAMES = ["Alex", "Jordan", "Sam", "Riley", "Casey", "Morgan", "Taylor", "Jamie"]
LAST_NAMES = ["Fletcher", "Okonkwo", "Novak", "Hartley", "Bauer", "Lindqvist", "Mercer", "Vasquez"]

SCHEMA = """
create table APP_REGION (
  ID text primary key,
  NAME text not null,
  TIME_ZONE text not null
);
create table APP_TECHNICIAN (
  ID text primary key,
  NAME text not null,
  EMAIL text not null,
  ROLE text not null,
  REGION_ID text not null,
  _SYNCED_AT text,
  _DELETED_AT text
);
create table APP_CUSTOMER (
  ID text primary key,
  NAME text not null,
  REGION_ID text not null,
  _SYNCED_AT text,
  _DELETED_AT text
);
create table APP_VISIT (
  ID text primary key,
  TECHNICIAN_ID text not null,
  CUSTOMER_ID text not null,
  REGION_ID text not null,
  STARTS_AT text not null,
  ENDS_AT text not null,
  LOCAL_START_HOUR integer not null,
  STATUS text not null,
  CREATED_AT text not null,
  _SYNCED_AT text,
  _DELETED_AT text
);
"""


def main() -> None:
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)

    synced_at = (dt.datetime(2026, 9, 24, 11, 0) - dt.timedelta(hours=4)).isoformat(sep=" ")

    conn.executemany(
        "insert into APP_REGION values (?,?,?)",
        [(r[0], r[1], r[2]) for r in REGIONS],
    )

    technicians = []
    roles = ["admin", "booker", "technician", "technician"]
    for region in REGIONS:
        for i in range(4):
            tid = f"{region[0][:3]}-t{i + 1}"
            name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            technicians.append((tid, name, f"{tid}@fieldflow.test", roles[i], region[0], synced_at, None))
    conn.executemany("insert into APP_TECHNICIAN values (?,?,?,?,?,?,?)", technicians)

    customers = []
    for region in REGIONS:
        for i in range(20):
            cid = f"{region[0][:3]}-c{i + 1:02d}"
            name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            deleted = synced_at if i % 20 == 19 else None
            customers.append((cid, name, region[0], synced_at, deleted))
    conn.executemany("insert into APP_CUSTOMER values (?,?,?,?,?)", customers)

    visits = []
    lost = 0
    n = 0
    day = SEED_START
    while day <= SEED_END:
        if day.weekday() < 5:
            for region_id, _name, _tz, offset, _lat, _lng in REGIONS:
                techs = [t for t in technicians if t[4] == region_id and t[3] == "technician"]
                custs = [c for c in customers if c[2] == region_id]
                for tech in techs:
                    for hour in START_HOURS:
                        if random.random() > 0.55:
                            continue
                        # The defect shipped on the regression date. From then on
                        # the engine stopped offering Leeds its last slot of the
                        # day, so nobody could book one.
                        if region_id == "leeds" and hour == 15 and day >= REGRESSION_DATE:
                            lost += 1
                            continue
                        n += 1
                        start_utc = dt.datetime.combine(day, dt.time(hour)) - dt.timedelta(hours=offset)
                        end_utc = start_utc + dt.timedelta(minutes=DURATION_MIN)
                        status = "Completed" if day < SEED_END - dt.timedelta(days=2) else "Booked"
                        if random.random() < 0.05:
                            status = "Cancelled"
                        visits.append((
                            f"V-{n:04d}", tech[0], random.choice(custs)[0], region_id,
                            start_utc.isoformat(sep=" "), end_utc.isoformat(sep=" "),
                            hour, status,
                            (start_utc - dt.timedelta(days=3)).isoformat(sep=" "),
                            synced_at,
                            synced_at if random.random() < 0.03 else None,
                        ))
        day += dt.timedelta(days=1)

    conn.executemany("insert into APP_VISIT values (?,?,?,?,?,?,?,?,?,?,?)", visits)
    conn.commit()

    meta = {
        "seed_start_date": SEED_START.isoformat(),
        "seed_end_date": SEED_END.isoformat(),
        "regression_date": REGRESSION_DATE.isoformat(),
        "last_synced_at": synced_at,
        "visits": len(visits),
        "leeds_late_bookings_lost": lost,
    }
    with open(META_PATH, "w", encoding="utf-8") as fh:
        json.dump(meta, fh, indent=2)

    print(f"regions      {len(REGIONS)}")
    print(f"technicians  {len(technicians)}")
    print(f"customers    {len(customers)}")
    print(f"visits       {len(visits)}")
    print(f"regression   {REGRESSION_DATE}")
    print(f"lost late Leeds bookings since regression: {lost}")
    conn.close()


if __name__ == "__main__":
    main()
