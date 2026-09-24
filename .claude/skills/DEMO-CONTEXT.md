# Shared context for every skill in this repo

All eight skills are ports of a private production skill set that ran against
Jira, Bitbucket, Confluence and Snowflake. Here, everything is local or on
GitHub. This file holds what they all share, so each skill file stays short.

## The app

FieldFlow schedules field-service visits. Customers book an on-site slot, a
technician travels to them, and a slot engine decides which times are offerable.

| Path | What lives there |
|---|---|
| `src/workingHours.ts` | Turns a technician's local working hours into a UTC window. Timezone logic. |
| `src/suggest.ts` | Walks a 30 minute grid across that window and returns available and rejected slots. |
| `src/types.ts` | Shared types, the region table, and the reason-code messages. |
| `src/server.ts` | HTTP API on port 4001, and serves `public/`. |
| `src/db.ts` | Read-only SQLite access. |
| `public/index.html` | The whole UI. One page, no framework. |
| `warehouse/` | The analytics mirror plus its query helper. |

Two regions, deliberately in different timezones: **Leeds** (Europe/London) and
**Munich** (Europe/Berlin). Anything that differs between them is usually a
timezone problem.

## Tickets are GitHub issues

```bash
gh issue view <n> --json number,title,body,comments
gh issue comment <n> --body-file <path>
gh issue create --title "<t>" --body-file <path>
gh issue edit <n> --body-file <path>
```

Acceptance criteria live in an `## Acceptance Criteria` section of the issue
body. There is no separate field.

## Pull requests are GitHub PRs

```bash
gh pr list --state open
gh pr view <n> --json number,title,body,headRefName,baseRefName,files
gh pr diff <n>
gh pr create --base develop --title "<t>" --body "Closes #<n>"
```

To find the PR for an issue, search for the issue reference:
`gh pr list --search "<n> in:body"`.

## The data warehouse

A read-only SQLite mirror at `warehouse/`. **Read `warehouse/SCHEMA_GUIDE.md`
first**, it documents the soft deletes and the sync lag that will otherwise
mislead you.

```bash
cd warehouse && python -c "from db import df; print(df('select ...'))"
```

`run(sql)` returns dicts, `df(sql)` returns a text table. Both reject anything
that is not a single SELECT.

## QA output goes in `qa/`

This directory stands in for a wiki. Write markdown, commit it.

| File | Written by |
|---|---|
| `qa/ticket-qa/<issue>/cases.md` | qa-test-cases |
| `qa/ticket-qa/<issue>/code-review-<date>.md` | qa-code-review |
| `qa/ticket-qa/<issue>/run-<date>.md` | qa-execute |
| `qa/library/<area>.md` | qa-test-cases, merged by ID |

Library areas and their ID prefixes: `booking` (`BOOK`), `calendar` (`CAL`),
`auth` (`AUTH`).

## The running app

`npm start` serves <http://localhost:4001>. Sign in with any address ending
`@fieldflow.test`. There is no real auth; the field exists so browser tests have
a login step to perform.

## House style

Simple, plain language. Short sentences. No filler, no preamble, no marketing
phrasing. One idea per line, bullets over paragraphs. No em dashes.
