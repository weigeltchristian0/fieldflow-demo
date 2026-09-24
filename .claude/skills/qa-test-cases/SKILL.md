---
name: QA Test Cases
user-invocable: true
description: Generate and classify test cases for a completed development ticket and write them to qa/. Use when someone wants test cases for an issue, generated from acceptance criteria, diff behaviours and code-review findings, classified by Priority, Layer, Destructive and Execution (Auto versus Manual), and mapped to the test case library. One of the three QA sub-skills sequenced by qa-orchestration; runs standalone too.
arguments:
  - name: issue
    description: The GitHub issue number to generate cases for
    required: true
  - name: to-issue
    description: "If set (--to-issue), append the cases-page link to the issue body as a managed block. Default off."
    required: false
  - name: no-library
    description: "If set (--no-library), skip library enrichment."
    required: false
---

# QA Test Cases

Read `.claude/skills/DEMO-CONTEXT.md` first.

## Purpose

Generate and classify test cases, write them to
`qa/ticket-qa/<issue>/cases.md`, and merge the reusable ones into
`qa/library/<area>.md`.

Cases marked `Execution = Auto` are later run by `qa-execute`.

## Phase 1: Generate and classify

Generate from these sources. Do not invent generic cases.

1. One happy-path case per acceptance criterion.
2. A case per meaningful new behaviour or branch in the diff.
3. The highest-risk edge cases, and any reported bug, as explicit negative cases.
4. Every bug, repro or clarified expectation raised in the issue comments.
5. When code-review findings are supplied, a negative case per newly found
   failure mode.

For each case, set:

- **Priority** - P1 blocking, P2 important, P3 nice.
- **Layer** - `Frontend` (the page) or `Backend` (API, data, slot logic).
- **Destructive** - `Yes` if the steps persist a change to shared state.
  `No` if read-only or UI-state-only: opening a view, asserting a list or a
  rendering, a validation error that does not submit, navigation, filtering.
- **Execution** - `Auto` only if `Layer = Frontend` **and** `Destructive = No`.
  Otherwise `Manual`.

  **This is the automation safety boundary and it is not negotiable.** Every
  backend case and every destructive frontend case is explicitly `Manual`.

- **Library mapping** - pick an area (`booking`, `calendar`, `auth`), read that
  library page, and tag the case `NEW`, `IMPROVES <AREA>-TC-<n>`, or
  `REUSES <AREA>-TC-<n>`. Reusing an existing canonical case is normal and
  valuable; it links this ticket to coverage that already exists.

Each case carries: working ID (`TC-01` onward), Title, Priority, Layer,
Destructive, Execution, Library, Preconditions, numbered Steps using real UI
labels, and Expected.

## Phase 2: Write the pages

**a) The cases page**, `qa/ticket-qa/<issue>/cases.md`. Test cases only. The
code review lives in its own dated file next to it.

Header: the issue title, the Execution split stated outright, and the Manual
case IDs listed (for example "Manual cases, run by hand: TC-02, TC-05").

Then one markdown table with these columns:

ID, Title, Pri, Layer, Destructive, Execution, Library, Preconditions, Steps,
Expected.

Steps go inline in the cell, numbered and separated by `<br>`. Keep everything
in the table so `qa-execute` parses one structure with nothing to chase.

**b) Enrich the library** (skip with `--no-library`). For each case tagged `NEW`
or `IMPROVES`, open `qa/library/<area>.md` and merge by ID, never blind-append:

- `NEW` - read the page, find the highest existing `<PREFIX>-TC-<n>`, add one.
- `IMPROVES <ID>` - update that row in place.
- `REUSES <ID>` - change nothing in the library.

Then update the cases page's Library column with the final canonical IDs.

Library pages use the same columns plus a trailing Source issue.

## Reruns

If the cases page already exists, decide what to add, change or remove based on
any supplied code-review findings, and summarise the delta in one line.

## Issue write-back (only with --to-issue)

This edits the issue body, not a comment. Read the current body, then append or
replace a single managed block at the very end, identified by its signature
line `_QA, auto-managed (do not edit below)_`.

The block is a horizontal rule, that signature line, then one line giving the
case counts (total, priority split, Auto versus Manual) and the path to
`qa/ticket-qa/<issue>/cases.md`.

Everything above the rule stays untouched. On a rerun, find the block by its
signature and replace only that block. Never stack duplicates.

## Final output

One line: `#<issue> -> <N> cases (<A> Auto, <P> promoted) -> <page path>`.
