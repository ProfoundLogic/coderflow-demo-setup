# PSACT Morning Report

Generate and send the presales team's activity report from Jira project PSACT.

Run this end-to-end without asking for confirmation - it is a scheduled,
unattended job.

## 1. Generate

```bash
cd /workspace/workspace/ibmi-agentic/docs/tools/psact-report
python3 psact_report.py --outdir /task-output
```

The script chooses its own mode from the weekday: **Monday** produces a recap of
the previous week, **Tuesday-Friday** covers the prior day only. It exits
without output at weekends.

If it prints a weekend message, stop here - there is no report to send.

Read the JSON it prints. It gives you the output paths, the counts, and
`precis.needed` - the tickets whose comments you are about to summarise.

## 2. Write the comment precis

The report does not quote comments verbatim. Each ticket that moved gets a
one-line precis printed under its own row, and **you write it** - this step is
the reason an agent runs this job rather than cron.

1. Read the digest: `/task-output/psact-report-<date>.digest.json`. It holds
   every ticket with comments in the window, the comments in full and in
   chronological order, and an `instructions` field restating the brief.
2. **One precis per ticket, merging every comment on it** - including comments
   from more than one person - into a single line. The comments are listed
   oldest first; summarise them in that order so the line reads as the day
   happened. One or two sentences, past tense, third person. No ticket key, no
   date, and do not open with an author's name; name people inline only where
   who did what matters ("Brian held the call, Gary booked the follow-up"). If a
   comment says what is next, end with that. Around 200 characters; 400 is the
   hard ceiling.
3. **It is a summary, not a transcript.** The reader clicks the ticket for the
   detail. If your line could be mistaken for the comment itself, it is too
   long.
4. **Say only what the comments say.** Never infer, embellish, or round up
   progress. A precis that credits work nobody did is worse than no report, and
   the three people reading it will know.
5. A ticket carrying a `rollup` block (PSACT-10 for PERP, PSACT-12 for WAT)
   usually has no comments of its own - summarise the child project's comments
   instead, as one line about the project. Do not restate its ticket counts; the
   report prints those beside your line.
6. Write the map to a file and regenerate **with `--require-precis`**:

```bash
cat > /task-output/precis.json <<'JSON'
{
  "PSACT-16": "Pre-demo call held with TaskForce, who agreed to start from the standard CoderFlow demo. Follow-up demo booked for Wed 26 Aug as PSACT-18.",
  "PSACT-12": "Sizing pass on the WAT customer-data epic: six tickets written up with scope, schema impact and hours, then closed."
}
JSON
python3 psact_report.py --outdir /task-output \
    --precis /task-output/precis.json --require-precis
```

`--require-precis` refuses to write the report at all if any ticket needing a
precis does not have one: it prints the missing keys and exits 2. That is the
whole point - without it, a skipped precis silently ships a truncated extract of
the raw comments, which is what this replaced. If it exits 2, cover the missing
keys and run it again. Do not drop the flag to get past it.

**Send the second render, never the first.**

## 3. Sanity-check before sending

Open the markdown output and read it. Confirm:

- the date and window in the header are what you expect;
- the counts in the JSON match what the markdown shows;
- each precis is supported by the comments you read - no claim you cannot point
  at a comment for;
- `precis.missing` is empty and `precis.supplied` matches the keys you wrote;
- nothing is obviously broken (empty sections are fine - an empty report is a
  legitimate result on a quiet day, and should still be sent).

If the generator fails outright, do **not** send a partial report. Report the
error in your summary and stop.

## 4. Email it

Send the email-safe HTML as the body, with the rich HTML attached:

```python
import json, subprocess, datetime as dt
d = dt.date.today()
stem = f"/task-output/psact-report-{d:%Y-%m-%d}"
mode = "Weekly Recap" if d.weekday() == 0 else "Daily Report"
payload = {
    "to": ["gjones@profoundlogic.com",
           "bmay@profoundlogic.com",
           "rbetancourt@profoundlogic.com"],
    "subject": f"PSACT {mode} - {d:%A %-d %B %Y}",
    "body": open(f"{stem}.email.html").read(),
    "attachments": [f"{stem}.html"],
}
open("/tmp/mail.json", "w").write(json.dumps(payload))
print(subprocess.run(["python3",
    "/home/coder/.claude/skills/email/email_send.py", "@/tmp/mail.json"],
    capture_output=True, text=True).stdout[-400:])
```

## 5. Append to the Confluence archive

Append the markdown digest (`<stem>.md`) to the current month's log page, using
the `confluence` skill. Space **CPP**.

| Page | ID |
| --- | --- |
| PreSales Activity Log (PSACT) — the parent hub | `2596569099` |
| Monthly log, titled `YYYY-MM - Month` (e.g. `2026-08 - August`) | look up by title |

Steps:

1. Look up the month page by title in space CPP: `GET /content?spaceKey=CPP&title=<YYYY-MM>%20-%20<Month>`.
2. If it does not exist, create it as a child of `2596569099`. Mirror the
   structure of the existing month page: two info macros (newest-first note, and
   the monthly-meeting note about regenerating figures from Jira), then an
   `<h2>Entries</h2>` heading.
3. Fetch the page to get its current version number — an update without the
   correct version will be rejected.
4. Insert the day's entry **immediately after `<h2>Entries</h2>`** so the newest
   entry is first. Remove the italic placeholder line
   (`The first automated entry will appear here...`) if it is still present.
5. Convert the markdown to Confluence storage format: `##` headings become
   `<h3>`, `####` become `<h4>`, list items become `<ul><li>`, `**bold**`
   becomes `<strong>`, and ticket keys become links to
   `https://plogic.atlassian.net/browse/<KEY>`.

Do not create a new page per day — one page per month, appended to.

## 6. Summary

Write `/task-output/summary.md` covering: the mode and window, the counts, how
many precis you wrote, who it was emailed to, and the Confluence page updated.
Keep it short - this runs every weekday and nobody reads a long summary.

Do not commit anything to the repository.
