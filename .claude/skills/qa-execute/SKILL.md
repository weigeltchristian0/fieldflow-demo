---
name: QA Execute
user-invocable: true
description: Run the browser-testable QA cases for a ticket against the local app with Playwright. Use whenever someone wants to execute, run or verify the automated browser tests for an issue. Reads the ticket's cases page, runs ONLY the cases marked Execution = Auto (non-destructive frontend cases), and writes PASS/FAIL results to a dated run page. Companion to qa-test-cases, which generates the cases.
arguments:
  - name: issue
    description: The GitHub issue number whose cases to run
    required: true
  - name: to-issue
    description: "If set (--to-issue), also post a dated results comment on the issue. Default off."
    required: false
---

# QA Execute

Read `.claude/skills/DEMO-CONTEXT.md` first.

## Purpose

Execute the browser-testable cases for a ticket and record the results. Cases
come from `qa/ticket-qa/<issue>/cases.md`, written by `qa-test-cases`.

This skill runs only cases marked `Execution = Auto`, which by construction are
non-destructive frontend cases, so they are safe to run unattended.

## Phase 1: Read the cases

Read `qa/ticket-qa/<issue>/cases.md`. Parse the table and select only rows where
`Execution = Auto`. Each row carries its own Preconditions, Steps and Expected
inline.

If there are no `Auto` rows, write nothing, report "no browser-testable cases
for #<issue>", and stop.

## Phase 2: Check the app is up

Check `http://localhost:4001/` returns 200. Anything else means the app is not
running: report "app not running, start it with npm start" and stop. Do not
start it yourself, the user may have it configured differently.

Base URL is `http://localhost:4001`, override with `TEST_BASE_URL`.

## Phase 3: Sign in

There is no real auth. Navigate to the base URL, fill **Email** with
`admin@fieldflow.test`, fill **Password** with anything, click **Sign in**, and
wait for the Date and Region controls to appear.

If a case names a different account, use that one.

## Phase 4: Run each case

For each `Auto` case, in order:

1. Follow its Steps literally, using the accessible names the case gives.
2. Compare what you observe against Expected.
3. Record PASS or FAIL. For a FAIL, write what you saw instead, in one plain
   sentence.
4. Take a screenshot on failure.

**Report what happened, not what should have happened.** A case that fails is
the single most valuable output this skill produces. Never soften it, never
re-run until it passes, and never rationalise a failure as a test problem
unless you have specific evidence that it is one.

If a case cannot be run at all, because a control is missing or the page errors,
record BLOCKED with the reason rather than guessing PASS or FAIL.

## Phase 5: Write the run page

Write `qa/ticket-qa/<issue>/run-<date>.md`. One run page per calendar date;
re-running the same day updates that date's page.

It carries:

- A heading with the issue and the date.
- A one-line tally: how many passed, failed and were blocked, out of how many
  Auto cases.
- A results table: ID, Title, Result, Notes.
- A Failures section, one subsection per failed case giving Expected, Actual,
  and the screenshot path.

Skip the Failures section entirely when there are none.

## Issue write-back (only with --to-issue)

Post a new comment each run, never edit a previous one. One line, no backticks,
starting with the italic signature `_QA Execute_`, then the pass and fail
counts, the date, one short plain clause, and a link to the run page.

Emoji: white check mark when all passed, cross mark on any failure, warning sign
on any blocked.

## Final output

One line: `#<issue> -> <P>/<N> passed -> <run page path>`.
