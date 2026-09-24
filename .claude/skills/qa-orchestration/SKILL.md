---
name: QA Orchestration
user-invocable: true
description: Run end-to-end QA of one or more development tickets, unattended. Use whenever someone wants to QA a ticket automatically or process a list of issue numbers end to end. A thin sequencer. It gathers each ticket's context once, then runs the three QA sub-skills (qa-code-review, then qa-test-cases, then qa-execute) per --phases, and emits one line per ticket. Contains no review, generation or write-back logic of its own.
arguments:
  - name: issues
    description: One or more GitHub issue numbers, space or comma separated
    required: true
  - name: phases
    description: "Which phases to run, comma separated: review,cases,execute. Default: review,cases."
    required: false
  - name: to-issue
    description: "If set (--to-issue), forward it to each sub-skill. Default off. The orchestrator itself never writes to an issue."
    required: false
---

# QA Orchestration

Read `.claude/skills/DEMO-CONTEXT.md` first.

## Purpose

Sequence the three QA sub-skills across a list of tickets. This skill is thin:
it gathers shared context once per ticket and delegates all real work.

- **qa-code-review** - multi-agent review, writes a dated review page.
- **qa-test-cases** - generate and classify, writes the cases page and library.
- **qa-execute** - run the `Auto` cases in a browser, writes a dated run page.

## Operating contract

1. **Never ask the user anything.** Missing info or a failed step gets recorded,
   and the run continues.
2. **Each ticket is independent.** A failed ticket gets a partial result. Never
   abort the whole run.
3. **Always produce output**, even for a partial or failed ticket.
4. **End with one line per ticket.**

## Flags

- `--phases=review,cases,execute` - default `review,cases`. Include `execute`
  only when the caller wants the browser run too.
- `--to-issue` - forwarded to each sub-skill that runs. The orchestrator
  performs no issue writes itself.

## Phase 0: Setup

- Date is the system date, `YYYY-MM-DD`.
- Parse the issue list into a deduped set of numbers.
- Note whether `warehouse/` exists, so the sub-skills know whether data
  grounding is available. Never block a ticket on it.

## Phase 1: Gather the context bundle once

Per ticket, gather once and pass down so the sub-skills do not re-fetch:

1. The issue: number, title, body, acceptance criteria, comments.
2. Its PRs: `gh pr list --search "<n> in:body"`.
3. The diff for each PR.
4. PR details: title, author, branches, changed files.
5. A short **comment digest**. Treat comments as a source of truth alongside the
   acceptance criteria: they carry reported bugs, repro steps, and changed
   expectations.

Then check out the PR branch so the review can read real source:

```bash
git fetch origin && git checkout <headRefName>
```

Verify it: grep for a distinctive new symbol from the diff. If it is absent, the
branch is wrong or unfetched. Fix it, or record "diff-only review" and continue.

Record, per ticket, the branch and commit checked out and whether it was
verified. Put that in the bundle so the sub-skills know whether the local source
is real and current.

If no PR is found, still run `qa-test-cases` against the acceptance criteria and
comments, and record it.

## Phase 2: Sequence

Run only the phases in `--phases`. Order matters, because test cases consume the
review's findings.

1. **review** - invoke `qa-code-review` with the bundle. Capture the verdict.
2. **cases** - invoke `qa-test-cases` with the bundle plus the review findings.
   Capture the case counts and the page path.
3. **execute** - invoke `qa-execute`. Capture the run tally and the page path.

A sub-skill failing for one ticket means recording the partial result and moving
on.

## Phase 3: Summary

One line per ticket:

```
QA run <date>:
  #4 -> DEPLOY WITH FOLLOW-UPS -> 9 cases (3 promoted, 4 Auto) -> qa/ticket-qa/4/cases.md
        run qa-execute 4 to execute the 4 Auto cases
  #7 -> HOLD -> 6 cases (2 promoted, 1 Auto) -> qa/ticket-qa/7/cases.md
```

## Guidelines

- Thin orchestrator: gather, sequence, summarise. No review or generation logic
  here.
- For interactive work, invoke a sub-skill directly instead of this one.
