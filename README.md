# FieldFlow

A field-service scheduling app, built to be broken and then fixed by agents.

There is a real bug in this repo. It shipped on a specific Sunday, it only
affects one of the two regions, and it is costing bookings. Eight Claude Code
skills live in `.claude/skills/`. Between them they can take the bug report in
`demo/bug-report.md` and carry it all the way to a reviewed pull request,
without anyone writing the fix by hand.

## Setup

```bash
npm install
npm start
```

That serves <http://localhost:4001>. Sign in with any address ending
`@fieldflow.test`. There is no real auth; the login exists so browser tests have
something to do.

Python is only needed for the warehouse queries, and only the standard library.
There is nothing to pip install.

## The bug, if you want to see it first

Pick an empty day and compare the two regions:

```bash
curl -s "localhost:4001/api/slots?date=2026-09-25&region=leeds"
curl -s "localhost:4001/api/slots?date=2026-09-25&region=munich"
```

Leeds offers 08:00 to 14:00 local. Munich offers 09:00 to 15:00. Both regions
work 09:00 to 17:00, so Leeds is being offered an hour nobody works and is
missing the last slot of the day. The whole demo is about finding out why.

## The skills

| Skill | What it does | Try it with |
|---|---|---|
| `bug-hunter` | Works backwards from a symptom to a ranked root cause, grounded in the code, the git history and the data warehouse. | the contents of `demo/bug-report.md` |
| `ticket-writer` | Turns a rough brief into a clean GitHub issue with real acceptance criteria. | bug-hunter's findings |
| `dev-ticket` | Implements an issue in an isolated worktree, runs the tests, self-reviews, opens a PR. | the issue ticket-writer filed |
| `code-explorer` | Multi-agent review of an issue and its PR, straight to the terminal. | `2` |
| `qa-orchestration` | Sequences the three QA skills below over one or more issues. | `1` |
| `qa-code-review` | Four specialists and two challengers, then a deploy verdict written to `qa/`. | `1` |
| `qa-test-cases` | Generates and classifies test cases, marks which are safe to automate. | `1` |
| `qa-execute` | Runs the automatable cases in a browser and records pass or fail. | `1` |

## The demo

Roughly fifteen minutes end to end.

1. **Show the report.** `cat demo/bug-report.md`. An ops person describing two
   symptoms, vague about the cause, which is how bug reports actually arrive.

2. **`bug-hunter`** with that report. It should route to `src/workingHours.ts`,
   name the hardcoded offset, quantify the damage from the warehouse, and find
   the commit that introduced it. Note that the report never mentions a file,
   a date, or a number; everything specific in the output was derived.

3. **`ticket-writer`** on those findings. Files a real issue, using what
   bug-hunter already established rather than starting over.

4. **`dev-ticket`** on that issue. Works in a worktree, replaces the hardcoded
   offsets, and turns the test on. There is a test in
   `src/workingHours.test.ts` marked `todo` because it has been failing since
   the regression. Watch it become a real passing test.

5. **`qa-orchestration 1`** on the pre-seeded PR. A verdict, plus generated test
   cases split into the ones safe to automate and the ones a human has to run.

6. **`qa-execute 1`** with the app running. It drives the browser and fails a
   case, which is the point. The review predicted the defect, the test cases
   encoded it, and the browser confirms it.

Steps 2 to 4 are the spine. Steps 5 and 6 work standalone off issue #1, so you
can demo just the QA half if you are short on time.

## What is planted, and why

Two defects exist on purpose.

**The timezone bug** (`src/workingHours.ts`, on `main`). A commit dated
2026-09-20 replaced a timezone-aware lookup with a hardcoded offset table, and
the Leeds entry is a copy of the Munich one. The git history tells the story
honestly: `git show` on that commit shows correct code being replaced by broken
code, and the same commit silences the test that would have caught it.

**The off-by-one** (`src/gaps.ts`, on PR #2). A loop runs to `length` instead of
`length - 1`, so a gap chip renders after the last visit as well as between
visits. On a day with exactly one visit that trailing chip is the only one on
screen, which makes it visible in a browser rather than only in a diff.

## How this repo stands in for real infrastructure

These skills are a point-in-time port of a private production set that ran
against Jira, Bitbucket, Confluence and Snowflake. Nothing proprietary came
with them. The substitutions:

| Real | Here |
|---|---|
| Jira issues | GitHub issues |
| Bitbucket PRs | GitHub PRs |
| Confluence pages | Markdown under `qa/` |
| Snowflake warehouse | SQLite at `warehouse/demo.db` |
| A staging environment | `localhost:4001` |
| Dozens of service repos | `docs/SERVICE-CATALOG.md` |

`.claude/skills/DEMO-CONTEXT.md` holds the shared detail, so each skill file
stays readable.

This is a snapshot for demonstration, not a maintained fork. The originals have
moved on.

## Layout

```
src/                 The service. workingHours.ts is where the bug lives.
public/index.html    The entire UI, one file, no framework.
warehouse/           SQLite mirror, a read-only query helper, and a schema guide.
demo/bug-report.md   The starting point.
docs/                Where things live, and how to route a symptom.
qa/                  Where the QA skills write their output.
.claude/skills/      The eight skills.
```

## Resetting

`npm run seed` regenerates the warehouse. It is deterministic, so you get the
same data every time and the demo tells the same story.

To re-run the whole thing, close any issues and PRs the skills created and
delete anything new under `qa/ticket-qa/`.
