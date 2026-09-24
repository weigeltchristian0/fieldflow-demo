---
name: Dev Ticket
user-invocable: true
description: Autonomously implement a GitHub issue end to end and open a pull request ready for review. Use whenever someone wants Claude to actually DO the development for a ticket. Reads the issue and its acceptance criteria, implements the change in an isolated git worktree, runs the tests, adversarially self-reviews its own diff, then opens a PR. The PR is the only human gate. Distinct from qa-code-review and code-explorer, which review existing work.
arguments:
  - name: issue
    description: The GitHub issue number to implement, e.g. 7. If omitted, ask.
    required: true
  - name: base
    description: "Branch to open the PR against. Default: develop."
    required: false
---

# Dev Ticket

Read `.claude/skills/DEMO-CONTEXT.md` first.

## Purpose

Take one issue all the way to a pull request opened ready for review. Fully
autonomous: there is **no plan-approval step**. The **PR is the only human
gate**, so everything before it exists to make that gate trustworthy.

## Operating principles

- **Never fake green.** If the tests cannot run, or a check fails, say so in the
  PR body. Evidence before assertions.
- **Worktrees only.** Never write code in the main working tree. Other skills
  check it out and would collide.
- **Match the repo.** Mirror the existing conventions and test style. Read
  neighbouring code before adding any.
- **Honest degradation.** If part of the issue is too ambiguous to implement
  safely, do the clear part and put the open questions in the PR body. Never
  guess your way to a merge-ready-looking diff.

## Phase 1: Read the issue

```bash
gh issue view <n> --json number,title,body,comments
```

The `## Acceptance Criteria` checklist is your definition of done.

Check nothing is already in flight:

```bash
gh pr list --search "<n> in:body" --state all
```

If a PR already exists, continue that branch or stop and report it. Do not
duplicate.

## Phase 2: Plan internally (no human gate)

Even though nobody approves this, write it down before touching code:

- The precise change: which files, which functions.
- The test that would prove it.
- Map **every acceptance criterion** to a concrete change. A criterion with no
  home is a red flag. Surface it as an open question rather than inventing scope.

If the issue is too vague to implement safely, stop here and say what is
blocking. Do not open a speculative PR.

## Phase 3: Work in a worktree

```bash
git fetch origin
git worktree add .dev-worktrees/issue-<n> -b <type>/<n>-<slug> origin/<base>
cd .dev-worktrees/issue-<n>
```

`<type>` is `fix` for a bug, `feat` otherwise.

Implement the change. Then:

- If a test exists that documents the broken behaviour (for example one marked
  `todo`), **make it a real passing test**, do not delete it.
- Add a test for anything new.

## Phase 4: Verify honestly

```bash
npm install
npm test
```

Record the actual result. If something fails and you cannot fix it, that goes in
the PR body under risks. Do not claim green you did not see.

## Phase 5: Self-review

Read your own diff as a hostile reviewer before opening anything.

- Does every acceptance criterion actually hold?
- Did you change anything the issue did not ask for?
- Any debug output, commented-out code, or stray file left behind?
- Would the test fail if you reverted the fix? If not, the test is not testing.

Fix what you find, then re-run the tests.

## Phase 6: Open the PR

```bash
git push -u origin <branch>
gh pr create --base <base> --title "<title>" --body-file <path>
```

The body carries, in this order:

```markdown
Closes #<n>

## What changed
<two or three lines, plain language>

## Verification
- Tests: <the real result, e.g. "npm test, 3 passing, 0 failing">
- Manual: <what you checked by hand, or "none">

## Acceptance criteria
- [x] <criterion> - <how it is met>

## Risks and what I did not do
<anything uncertain, skipped, or out of scope. "None" is a valid answer only if true.>
```

## Phase 7: Report back

Comment the PR link on the issue, then clean up:

```bash
gh issue comment <n> --body "PR opened: <url>"
git worktree remove .dev-worktrees/issue-<n>
```

Final output is one line: `#<n> → <branch> → <PR url> → <test result>`.
