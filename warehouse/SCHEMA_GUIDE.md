# Warehouse Schema Guide

Read this before querying. It is a small mirror of the FieldFlow app database,
and a few of its conventions will mislead you if you do not know them.

## Access

```bash
cd warehouse
python -c "from db import df; print(df('select count(*) as n from APP_VISIT'))"
```

`run(sql)` returns rows as dicts. `df(sql)` returns an aligned text table.
Both reject anything that is not a single SELECT.

## Tables

| Table | Rows | What it holds |
|---|---|---|
| `APP_REGION` | 2 | `ID`, `NAME`, `TIME_ZONE`. Leeds is Europe/London, Munich is Europe/Berlin. |
| `APP_TECHNICIAN` | 8 | `ID`, `NAME`, `EMAIL`, `ROLE`, `REGION_ID`. Roles are `admin`, `booker`, `technician`. |
| `APP_CUSTOMER` | 40 | `ID`, `NAME`, `REGION_ID`. |
| `APP_VISIT` | ~200 | The bookings. Join to the rest on `TECHNICIAN_ID`, `CUSTOMER_ID`, `REGION_ID`. |

## Gotchas

**Timestamps are UTC and naive.** `STARTS_AT` and `ENDS_AT` carry no offset and
no `Z`. The regions are in different timezones, so a UTC hour does not tell you
the local hour. `APP_VISIT.LOCAL_START_HOUR` is stored precisely so you do not
have to do that conversion yourself.

**Soft deletes.** Rows with a non-null `_DELETED_AT` are deleted. Almost every
query wants `where _DELETED_AT is null`. Forgetting it inflates counts.

**The mirror lags the app.** `_SYNCED_AT` is the last time a row was copied
across, and it runs hours behind. A row that is missing, or a count that looks
like zero for today, is very often just unsynced rather than absent. Before
concluding that something does not exist, check how stale the mirror is:

```sql
select max(_SYNCED_AT) as last_sync from APP_VISIT
```

If the thing you are looking for was created after that timestamp, the mirror
simply has not caught up, and you have learned nothing about whether it exists.

**Status casing is mixed.** `STATUS` holds `Booked`, `Completed`, `Cancelled`.
Compare exactly, or lowercase both sides.
