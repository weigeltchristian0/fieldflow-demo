---
name: Ticket Writer
user-invocable: true
description: Write concise, well-structured GitHub issues (Story, Task or Bug) from a rough brief. Use whenever someone wants to create, draft or write an issue or ticket for FieldFlow. Produces a user story or a Problem/Solution body, with business-oriented acceptance criteria. Drafts first, confirms, then creates.
arguments:
  - name: brief
    description: Rough description of what the ticket is about. If omitted, ask.
    required: false
  - name: type
    description: "Force the type: --type=Story | Task | Bug. If omitted, infer and confirm."
    required: false
  - name: draft-only
    description: "If set (--draft-only), produce the text and do NOT create the issue."
    required: false
---

# Ticket Writer

Read `.claude/skills/DEMO-CONTEXT.md` first.

## Purpose

Turn a rough brief into a clean issue. Be terse. Every line earns its place.

## Voice rules

- Plain, direct sentences. Cut "in order to", "basically", "please note".
- One idea per line. Bullets over paragraphs.
- Concrete nouns (field, endpoint, region, role) over vague ones ("the system").
- Do not restate the title in the body.
- Do not pad acceptance criteria to look thorough.

## Types

**Story** - user-facing capability. Body is a user story.

```
As a <role>
I want <capability>
So that <outcome>
```

**Task** - technical work with no direct user story. Body is Problem then Solution.

**Bug** - something broken. Body is Problem, Steps to reproduce, Expected,
Actual. When the brief comes from `bug-hunter`, use its findings as given and
do **not** re-run code analysis.

## Acceptance criteria

Always an `## Acceptance Criteria` section at the end of the body, as a
checklist. Write them as **business outcomes**, not implementation steps.

Good: `- [ ] A scheduler can book the 15:00 Leeds slot again.`
Bad: `- [ ] REGION_OFFSETS is replaced with an Intl lookup.`

Three to five is usually right. If you cannot write a criterion that someone
could check without reading the diff, the brief is too vague. Ask.

## Technical details

Include them only where a developer needs them to start, as short labelled
bullets, never dense prose. If there is nothing concrete to name, leave the
section out rather than filling space.

```
## Technical details
- **File:** src/workingHours.ts
- **Related:** #12
```

## Workflow

1. **Infer the type** from the brief. Say which you picked and why, in one line.
2. **Draft the whole issue** and show it to the user: title, body, acceptance
   criteria.
3. **Confirm.** Ask whether to create it, or what to change. Stop here if
   `--draft-only`.
4. **Create it:**

```bash
gh issue create --title "<title>" --body-file <path>
```

5. **Report** the issue number and URL in one line.

## When the brief needs facts you do not have

If the brief depends on how the code actually behaves, invoke `code-explorer`
rather than guessing. Do not do this when the brief already carries findings
from `bug-hunter`; that work is done.
