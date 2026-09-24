---
name: QA Code Review
user-invocable: true
description: Multi-agent code review of a completed development ticket, written to a dated markdown page under qa/. Use when someone wants ONLY a code review of an issue and its PR (verdict plus findings), with no test-case generation and no browser run. Runs 4 specialist agents plus 2 challengers over the PR diff and synthesises a deploy verdict. One of the three QA sub-skills sequenced by qa-orchestration; runs standalone too.
arguments:
  - name: issue
    description: The GitHub issue number to review
    required: true
  - name: to-issue
    description: "If set (--to-issue), also post a dated summary comment on the issue. Default off."
    required: false
---

# QA Code Review

Read `.claude/skills/DEMO-CONTEXT.md` first.

## Purpose

Produce a code-review verdict and write it to
`qa/ticket-qa/<issue>/code-review-<date>.md`. Each run writes a new dated file,
so review history is preserved.

Test-case generation lives in `qa-test-cases`. Browser execution in
`qa-execute`. Sequencing in `qa-orchestration`.

## Context bundle

When `qa-orchestration` runs this, it passes a prepared bundle. Use it verbatim
and skip re-fetching. Standalone, gather it yourself: issue, PR list, PR diff,
PR details, and the checked-out branch (see `code-explorer` Phase 0 for the
commands).

Treat issue **comments as authoritative alongside the acceptance criteria**. A
comment may report a bug, change expected behaviour, or carry QA feedback the
diff has to satisfy.

Include in every agent prompt:

> Source is at the repo root, checked out to this PR's branch. Use Read, Grep
> and Glob for context. The live PR diff always wins over local source. Do not
> use Bash for file operations.

State in the verdict which mode you were in: **source-verified** if the working
tree is confirmed on the PR branch, or **diff-only** otherwise. Diff-only means
unconfirmed runtime findings stay "verify", not "confirmed".

## Phase A: Four specialists, one message

Dispatch in parallel. The four roles, their focus, and their output shapes are
exactly as in `code-explorer` Phase 1: Code Quality, Edge Cases, Test Coverage,
Requirements. Do not duplicate their briefs here; read that file.

## Phase B: Two challengers, one message

Devil's Advocate and Pragmatist, exactly as in `code-explorer` Phase 2.

## Phase C: Synthesise and write the page

Resolve conflicts, dedupe, set final severity and the deploy verdict.

**Write for someone who does not read code.** This is the most important rule
for the page.

- **Everyday words.** Say "the calendar shows a travel time after the last
  visit", not "useTravelTimes slices the array without dropping the tail".
  No method or class names in prose.
- **Plain status words.** Use **Blocker / Must fix / Should fix / Note**, not
  CRITICAL or CONCERN. In the requirements table use **Done / Partly / Not
  done**, not PASS or FAIL.
- **Short.** One sentence per finding. Aim for four to six findings, not a
  catalogue. Fold low-value items into one line or drop them.
- **Lead with the takeaway.** Each bullet starts with a bold plain label, then
  the consequence, then the fix.

Structure of `qa/ticket-qa/<issue>/code-review-<date>.md`:

```markdown
# <issue> · Code Review - <date>

**Verdict: Deploy as-is | Deploy with follow-ups | Hold**

<one plain sentence on why>

*<review mode: source-verified or diff-only, and whether a PR existed>*

## What we found

- **<plain label>** - <impact>. <fix>.

## Code evidence

*For the developers: the exact code behind each finding.*

<details>
<summary><plain language title></summary>

`src/file.ts:42`

```ts
<short excerpt, 15 lines or fewer, trimmed to the offending code>
```

</details>

## Requirements

| Requirement | Status | Note |
|---|---|---|

## Tests to add

- <one line each, for qa-test-cases to pick up>
```

Technical content lives **only** inside the collapsed code-evidence blocks. The
prose above stays non-technical.

Record the verdict for the orchestrator's summary.

## Issue write-back (only with --to-issue)

The markdown page is always written; this is additive.

Post a **new** comment every run. Never edit a previous one; review history
lives in the comment stream, matching the dated pages.

One line, no code, no backticks:

```
_QA Code Review_ - <emoji> **<VERDICT>** (<date>): <one short plain clause> [Full review](<relative path>)
```

Emoji: ✅ deploy as-is, ⚠️ with follow-ups, ⛔ hold.

## Final output

One line: `#<issue> → <verdict> → <page path>` plus `· commented` if
`--to-issue`.
