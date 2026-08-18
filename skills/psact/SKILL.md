---
name: PSACT PreSales Tracker
description: Runbook for the PSACT presales activity tracker in Jira. Use when
  asked to create, update, assign, close, comment on, or report against PSACT
  tickets, presales demos, POCs, discoveries, or the daily presales status
  report. Covers the epic structure, statuses, label conventions,
  umbrella/rollup tickets, and the reporting automation.
argument-hint: create | update | close | comment | report
createdAt: 2026-08-18T05:30:25.673Z
createdBy: gjones
createdByName: Gary Jones
createdById: user_1767620328397_iectw4bix
updatedAt: 2026-08-18T05:43:02.795Z
updatedBy: gjones
updatedByName: Gary Jones
updatedById: user_1767620328397_iectw4bix
---
# PSACT — PreSales Activity Tracker

The runbook for Jira project **PSACT** (`PreSales Activity and Tasks`) on
`https://plogic.atlassian.net`. Use this whenever someone asks to create,
update, close, comment on, or report against presales workload tickets.

Use the `jira` skill for the API calls, but follow the conventions here — they
are not discoverable from the Jira project itself, and getting them wrong makes
the daily report misreport the team's work.

## The team

| Person | Email | Jira account ID |
| --- | --- | --- |
| Gary Jones | gjones@profoundlogic.com | `615afb5dd9820f0070a0864e` |
| Brian May | bmay@profoundlogic.com | `557058:81c3c225-9739-472a-b3ac-079307d00815` |
| Roger Betancourt | rbetancourt@profoundlogic.com | `712020:4494da40-c016-4402-bedb-7195a1bf11f3` |

There are **two Brians** in this Jira. Brian **May** (`bmay@`) is on this team.
Brian **Rees** (`brees@`) is not — never assign PSACT work to him.

**Every ticket needs an assignee.** Unassigned open tickets are called out in the
daily report as having no owner. If the requester does not say who owns it,
assume the person asking.

## Epics — always set a parent

Epics are **permanent containers**, not units of work. They sit in In Progress
forever. Never close one, and never create a new epic without being asked.

| Epic | Name | What belongs there |
| --- | --- | --- |
| `PSACT-1` | Customer Demos | One ticket per demo engagement |
| `PSACT-2` | Proofs of Concept | POCs, usually born from a demo |
| `PSACT-3` | RFPs & Questionnaires | Bid responses, security questionnaires |
| `PSACT-4` | Events & Webinars | Conferences, user groups, webinars |
| `PSACT-5` | Demo Environments & Assets | Demo estate upkeep, reusable demo material |
| `PSACT-6` | Efficiency & Improvements | Internal tooling, automation, process |
| `PSACT-7` | Education & Enablement | Training given or received, certifications |
| `PSACT-8` | General / Miscellaneous | Catch-all — see note below |
| `PSACT-11` | Discovery & Sizing | Architect-and-size work, handed to Services |

Boundaries that are easy to get wrong:

- **PSACT-5 vs PSACT-6** — keeping the lights on and building demo assets go in
  5; building *new internal capability* goes in 6.
- **PSACT-1 vs PSACT-11** — a demo shows the product; a discovery architects and
  sizes a customer's system. A discovery closes at **handover to Services**, not
  when the customer's project finishes.
- **PSACT-8** is legitimate, but if several related tickets accumulate there,
  say so — it usually means a new epic is wanted.

## Issue types

**Epic and Task only.** Never create a Story or a Bug in PSACT — Story-vs-Task is
a decision tax with no payoff here, and bugs belong in whichever delivery project
they affect. **Do not use Sub-task** even though Jira offers it; it breaks the
daily report's one-ticket-one-line structure. For multi-step work, put a
checklist in the description using an ADF `taskList`.

## Statuses

`To Do` → `In Progress` → `Waiting` → `Done`, plus `Cancelled`.

- **Waiting** means someone *else* is holding it up — customer hasn't replied, a
  licence hasn't landed. Say who in a comment.
- **Cancelled**, not Done, when a demo or engagement does not happen. Routing a
  cancelled demo to Done inflates the count of demos actually delivered.
- Transition with the `jira` skill: `transition PSACT-9 "In Progress"`.

## Labels

| Label | When |
| --- | --- |
| `customer:<shortname>` | Every customer-facing ticket. Lowercase, hyphenated — `customer:hal-leonard` |
| `outcome:poc` / `outcome:followup` / `outcome:no-fit` / `outcome:won` | Applied when a demo or POC **closes** |
| `parked` | Deliberately deferred — suppresses the staleness nudge |
| `rollup:<project>` | Marks an umbrella placeholder (see below) |
| `rollup-mine` | Narrows a rollup to the ticket's own assignee |

The `customer:` label is what makes "who did we demo to this quarter" a query
instead of an afternoon of reading. Do not bury the customer name in the summary
only.

## Umbrella tickets — do not duplicate another project

If the work has its own Jira project, PSACT holds **one placeholder** that points
at it. Never copy that project's tickets into PSACT.

| Existing | Labels | Resolves to |
| --- | --- | --- |
| `PSACT-10` | `rollup:perp` | all of PERP — the demo ERP build |
| `PSACT-12` | `rollup:wat`, `rollup-mine` | Gary's slice of WAT — Watsons discovery |

Add **`rollup-mine`** when the target project is shared with people outside this
team (WAT is worked by Mike Lamere and Ajay Gomez too). Without it the report
counts their work as ours. Omit it when the target project is wholly ours or
unassigned (PERP).

The report reads through to the target project for progress and comments, so an
umbrella ticket needs no comments of its own.

`rollup:` keys on **project, not epic** — there is currently no way to roll up a
single epic of another project.

## Creating a ticket

Set at minimum: project, `parent` (the epic), issuetype Task, summary, assignee.
Add a due date whenever a real date exists — a demo date, an RFP deadline. A
future due date also exempts the ticket from the staleness nudge, which is
correct: it is scheduled, not stalled.

Summary style: lead with the customer or subject, keep it scannable, and include
the date for a scheduled event —
`Hal Leonard - CoderFlow demo (Wed 19 Aug, 11:00)`.

```bash
bash ~/.claude/skills/jira/jira.sh create '{
  "fields": {
    "project":   {"key": "PSACT"},
    "parent":    {"key": "PSACT-1"},
    "issuetype": {"name": "Task"},
    "summary":   "Acme Corp - Genie demo (Thu 4 Sep, 14:00)",
    "duedate":   "2026-09-04",
    "labels":    ["customer:acme-corp"],
    "description": { "type": "doc", "version": 1, "content": [
      {"type":"paragraph","content":[{"type":"text","text":"..."}]}
    ]}
  }
}'
bash ~/.claude/skills/jira/jira.sh assign PSACT-nn rbetancourt@profoundlogic.com
```

Descriptions use **ADF** (Atlassian Document Format), not markdown. A useful
description covers why the work exists, anything the report cannot infer, and —
for a demo — attendees and a short prep checklist. Where facts are unknown, write
them as explicit open questions rather than inventing them.

## Closing a demo or POC

1. Add the `outcome:` label.
2. Add a comment: what was shown, how it landed, the agreed next step.
3. Transition to `Done` — or `Cancelled` if it never happened.
4. If the outcome is `outcome:poc`, offer to raise the POC ticket under
   `PSACT-2`, linked back to the demo.

## End-of-day comments

This is the one habit the whole reporting scheme depends on. The daily report
quotes comments verbatim as the narrative of what happened.

**Start straight in with the detail.** Do not prefix a comment with `Did:` or a
similar label — the report already presents these under a "what happened"
heading, so the label is noise. Where it helps, mark what is left with a
`Next:` partway through:

```
Reworked the plate layout so each person's falling-behind items lead their
block. Next: confirm the Confluence append works on an unattended run.
```

(The report strips a leading `Did:` on display for comments already written that
way, but new comments should not include it.)

Free text is fine otherwise — no format policing. When someone asks you to log a
day's work, write the comment in their voice covering what actually moved and
what is next. Do not invent progress.

## The daily report

Generated at 07:30 on weekdays by the `psact-morning-report` template, from
`ibmi-agentic/docs/tools/psact-report/psact_report.py`. It emails all three of
them and appends a digest to Confluence. Read that tool's README before changing
report behaviour.

Two things worth knowing when someone asks why something did or didn't appear:

- **Staleness is measured on `updated`, not on comments.** Transitions and edits
  count. Thresholds: In Progress 7 days, Waiting 14, To Do 21. Exempt if the due
  date is in the future or the ticket is labelled `parked`.
- It is **one shared report**, with a plate per person led by whatever is falling
  behind for them — so the team can offer help. Not three personal reports.

To regenerate on demand:

```bash
cd /workspace/workspace/ibmi-agentic/docs/tools/psact-report
python3 psact_report.py --outdir /tmp/psact          # today
python3 psact_report.py --date 2026-08-19 --outdir /tmp/psact
```

## Useful queries

```
project = PSACT AND statusCategory != Done ORDER BY assignee
project = PSACT AND assignee = "Gary Jones" AND statusCategory != Done
project = PSACT AND parent = PSACT-1 AND labels = "outcome:poc"
project = PSACT AND duedate >= startOfDay() AND duedate <= endOfWeek()
project = PSACT AND statusCategory != Done AND updated <= -7d
project = PSACT AND labels = "customer:hal-leonard"
```

## Traps

- **`jira.sh search` does not paginate.** Its `maxResults` argument is forwarded,
  but `/search/jql` caps each response at 100, and the default with no argument
  is **20**. A total of exactly 20 or 100 is almost certainly truncated. Its
  field list also omits `parent`, `labels` and `duedate`, so children look
  unparented and labels look absent. For anything quantitative, page via
  `nextPageToken` — the `Jira` class in `psact_report.py` does this.
- **`jira.sh link` capitalises only the first letter**, so `link A "relates to" B`
  fails. Use `link PSACT-12 relates WAT-64`.
- `jira.sh` cannot create projects, and cannot edit status categories.
- Confluence updates need the page's **current version number** fetched first.
- Never write a report or archive entry that claims work happened without a
  comment or transition backing it.

## Confluence

Human-facing documentation lives in space **CPP** under *Pre-Sales Team*:

| Page | ID |
| --- | --- |
| PreSales Activity Log (PSACT) — hub and runbook | `2596569099` |
| Monthly log, `YYYY-MM - Month` | child of the hub |

One page per **month**, appended to, newest entry first. Never a page per day.
