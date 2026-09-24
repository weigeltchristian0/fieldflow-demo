---
name: Code Explorer
user-invocable: true
description: Multi-agent QA review of a completed development ticket. Use when someone wants a thorough review of an issue and its PR, with specialist agents that analyse different aspects independently and then challenge each other's findings. Terminal output only, no files written.
arguments:
  - name: issue
    description: The GitHub issue number to review (e.g. 4)
    required: true
---

# Code Explorer

Read `.claude/skills/DEMO-CONTEXT.md` first.

## Purpose

Review a completed ticket using specialist sub-agents that analyse independently,
then challenge each other to reach consensus. Output goes to the terminal.

`qa-code-review` does something similar but writes a markdown verdict page and
is sequenced by `qa-orchestration`. This one is the standalone, interactive
version. Use whichever the user asks for.

## You are the orchestrator

You do **not** do the analysis. You gather context, dispatch agents, and compile
their work.

## Phase 0: Gather context

```bash
gh issue view <n> --json number,title,body,comments
gh pr list --search "<n> in:body" --json number,title,headRefName
gh pr diff <pr>
gh pr view <pr> --json number,title,body,headRefName,baseRefName,files
```

Check out the PR branch so agents can read real source, not just the diff:

```bash
git fetch origin && git checkout <headRefName>
```

Verify the checkout is real: grep for a distinctive new symbol from the diff. If
it is absent, the branch is wrong. Fix it, or review diff-only and say so.

Compile a context bundle: issue title, body, acceptance criteria, comments, the
full diff, the branch and commit checked out, and the repo map from
`docs/SERVICE-CATALOG.md`.

If no PR exists, say so and stop.

## Phase 1: Four specialists, one message

Dispatch all four in parallel. Give each the bundle and this instruction:

> Read source with Read, Grep and Glob. The live PR diff always wins over local
> source. Do not use Bash for file operations.

**Agent 1, Code Quality.** Only code quality, not edge cases or requirements.
Per finding: severity (CRITICAL / CONCERN / SUGGESTION), `file:line`, the issue,
why it matters, the fix. Focus on logic, security, performance, consistency,
error handling.

**Agent 2, Edge Cases.** Only edge cases and failure scenarios. Consider null
and empty, boundaries, type mismatches, races, network failures, state
transitions, permission boundaries, timezone and DST. Report only UNHANDLED or
PARTIAL, as a table: scenario, status, risk, mitigation.

**Agent 3, Test Coverage.** Only coverage. Which tests were added or changed?
Quality of what exists? What should be tested and is not? Prioritise missing
coverage as CRITICAL / IMPORTANT / NICE, and report only the first two.

**Agent 4, Requirements.** Only requirements versus implementation. Extract every
requirement from the acceptance criteria, body, title and comments. A comment
that changes expected behaviour is a requirement too. Per requirement:
PASS / PARTIAL / FAIL / CANNOT VERIFY, with evidence. Flag scope creep.

## Phase 2: Two challengers, one message

Give both the bundle plus all four reports.

**Challenger A, Devil's Advocate.** False positives? Overstated severity? Wrong
assumptions? Duplicates? Anything missed, re-reading the diff? Per finding:
KEEP / DOWNGRADE / UPGRADE / REMOVE, with a reason. Then new findings only.

**Challenger B, Pragmatist.** Filter for signal: would this cause a real
incident, data loss, a security hole, or block users, versus being theoretical?
Sort everything into MUST FIX / SHOULD FIX / CONSIDER / DROP. Flag false alarms
and standard patterns of this codebase. End with a deploy recommendation.

## Phase 3: Synthesise

Resolve conflicts using your judgment, honouring good challenger calls. Dedupe.
Set final severity, pragmatist-led and devil's-advocate-adjusted.

Output to the terminal:

```
<ISSUE> - <title>
Verdict: DEPLOY AS-IS | DEPLOY WITH FOLLOW-UPS | HOLD
Mode: source-verified | diff-only

Must fix
- <file:line> - <one line>

Should fix
- <file:line> - <one line>

Requirements
- AC1 <Done | Partly | Not done> - <one clause>

Tests to add
- <one line>
```

One line per finding. No filler. Skip sections with nothing in them.
