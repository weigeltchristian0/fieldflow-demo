---
name: Bug Hunter
user-invocable: true
description: Triage and root-cause a bug report from a symptom, grounded in the FieldFlow code and the read-only analytics mirror. Use whenever someone pastes or describes a bug and wants to know WHAT is broken, WHERE in the code, WHY, and what to do next. Works backwards from a symptom, unlike code-explorer and qa-code-review which review a known PR. Optionally files a GitHub issue with --ticket.
arguments:
  - name: report
    description: The bug report as free text. If omitted, ask for it.
    required: false
  - name: deep
    description: "If set (--deep), fan out sub-agents for hard or ambiguous bugs. Default off."
    required: false
  - name: ticket
    description: "If set (--ticket), hand the findings to ticket-writer to file a GitHub issue. Default off."
    required: false
---

# Bug Hunter

Read `.claude/skills/DEMO-CONTEXT.md` first.

## Purpose

A bug report tells you a **symptom**, not a cause. This skill works backwards:
localize the symptom, read the current code, confirm the pattern in the data,
and hand back ranked root-cause hypotheses with evidence.

Be honest about uncertainty. A confident wrong answer wastes more time than an
honest "most likely X, here is how to confirm."

## Operating principles

- **Concise above all.** This gets pasted into a chat thread. One line per
  hypothesis, no filler, no restating the report back.
- **Evidence beats assertion.** Every hypothesis cites a `file:line` or a real
  figure from the data. No evidence means mark it a guess.
- **Localize before you read.** Use `docs/SERVICE-CATALOG.md` to pick the
  suspect file first. Do not read the whole repo.
- **Check the history.** `git log` and `git show` on a suspect file tell you
  whether a recent change lines up with when the symptom started. A regression
  usually means correct code existed before.

## Phase 0: Parse the report

Restate it as a one-line symptom statement. Pull out:

- **What** is wrong, observed versus expected.
- **Where or who**, any concrete entity: region, date, visit, role, screen.
- **When** it started, how often, new or a regression.
- **Severity hints**, how many users, data loss, money, blocking.

List what is **missing**. Surface those as questions for the reporter rather
than guessing.

## Phase 1: Localize

Use `docs/SERVICE-CATALOG.md` to pick the one or two most likely files and the
suspect path. State your routing reasoning in one line.

A symptom that hits one region and not the other is a timezone seam until
proven otherwise.

## Phase 2: Read the code

Read with Read, Grep and Glob. Follow the logic from entry point to data.

Look for the usual culprits: unhandled null or empty, an enum or casing
mismatch, a wrong filter, an off-by-one, a hardcoded value that should be
derived, a state race, a timezone conversion.

Then check whether a recent commit lines up with the reported timing:

```bash
git log --oneline -10 -- <suspect file>
git show <sha> -- <suspect file>
```

## Phase 2.5: Slot and scheduling symptoms

When the symptom is "no slots", "wrong slots", or "a slot that should be there
is missing", the window comes before the collision rules. Check
`workingHours.ts` before `suggest.ts`, because a wrong window silently changes
every candidate. Compare the two regions: if only one is wrong, the shared
collision logic is not the cause.

Reason codes are many-to-one. One user-facing message can come from several
distinct causes, so enumerate all of them before ranking.

## Phase 3: Ground it in data

If the symptom involves counts, state, or "how many are affected", confirm it
rather than guessing.

Read `warehouse/SCHEMA_GUIDE.md` first, then query:

```bash
cd warehouse && python -c "from db import df; print(df('select ...'))"
```

Use it to confirm the pattern is real, and to quantify blast radius and since
when.

**The mirror lags.** A zero count, especially for something recent, often means
not synced yet rather than does not exist. Check `max(_SYNCED_AT)` before
concluding anything from an absence. Never downgrade a real report on a miss
alone.

If a query errors, skip it silently. Grounding is a bonus, never required.

## Phase 3.5: Deep mode (only with --deep)

For hard or ambiguous bugs, launch in parallel:

- **A code tracer per suspect area.** "Trace the path for symptom S from entry
  point to data. Report the single most likely defect with `file:line` and why."
- **A data agent** running the warehouse checks.

Then **one challenger**: "Attack these hypotheses. Which are false positives,
what was missed, re-rank by real-world likelihood."

## Phase 4: Output

Keep it tight enough to paste into a chat. Omit empty sections.

```
🐛 *<one-line symptom statement>*
Scope: <severity and blast radius, or "unknown, needs repro">

*Most likely cause* (confidence: High/Med/Low)
<file:line> - <one-line explanation> <(+ evidence)>

*Other hypotheses*
- <file:line> - <one-liner> (conf: M/L)

*Data check*
<one line: what you confirmed and the figure>

*Next step*
<the single most useful action>
```

## Phase 5: File a ticket (only with --ticket)

Invoke `ticket-writer` and hand it everything you already found so it does
**not** re-investigate: the symptom line, the concrete examples, the ranked
findings with `file:line` refs, the suggested fix, and any reference IDs.

Tell it explicitly not to re-run code analysis. Keep the technical notes in
plain language, with file names in parentheses for developers.

Relay the resulting issue number and URL in your output.
