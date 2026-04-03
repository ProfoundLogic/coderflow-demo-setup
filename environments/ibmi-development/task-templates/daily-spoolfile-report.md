# Daily Spool File Analysis Report

Run the following workflow end-to-end without asking any questions:

## Step 1: Query Output Queues

Use the `sql` skill to query the IBM i system for output queue information. Run this SQL:

```sql
SELECT OUTQ_LIB, OUTQ_NAME, NUMBER_FILES FROM QSYS2.OUTPUT_QUEUE_INFO ORDER BY NUMBER_FILES DESC FETCH FIRST 50 ROWS ONLY
```

Identify the top 3 output queues by number of spool files (NUMBER\_FILES).

## Step 2: Analyze Top Offender Users

For each of the top 3 output queues, use the `sql` skill to query spool file details to find the worst offender users:

```sql
SELECT JOB_USER, COUNT(*) AS FILE_COUNT, MIN(CREATE_TIMESTAMP) AS OLDEST_FILE, MAX(CREATE_TIMESTAMP) AS NEWEST_FILE, SUM(SIZE) AS TOTAL_SIZE FROM QSYS2.OUTPUT_QUEUE_ENTRIES_BASIC WHERE OUTQ_NAME = '<outq_name>' AND OUTQ_LIB = '<outq_lib>' GROUP BY JOB_USER ORDER BY FILE_COUNT DESC
```

Also query status breakdown per queue:

```sql
SELECT STATUS, COUNT(*) AS CNT FROM QSYS2.OUTPUT_QUEUE_ENTRIES_BASIC WHERE OUTQ_NAME = '<outq_name>' AND OUTQ_LIB = '<outq_lib>' GROUP BY STATUS ORDER BY CNT DESC
```

## Step 3: Generate 3 Insights Per Queue

For each of the top 3 output queues, produce 3 meaningful insights such as:

-   Age distribution (how old are the spool files? Are there ancient ones sitting around?)
-   User concentration (is one user responsible for the majority?)
-   Status breakdown (how many are held vs ready vs other?)
-   Size analysis (total storage consumed, largest files)

## Step 4: Recommendations

Provide actionable recommendations for reducing spool file accumulation long-term, covering:

-   Automated cleanup routines (e.g., scheduled CL programs to delete old spool files using DLTSPLF)
-   User education (best practices for managing print output, clearing held files)
-   System configuration (auto-delete settings, output queue management policies)
-   Monitoring and alerting suggestions

## Step 5: Produce PDF Report

Use the `pdf` skill to create a professional PDF report titled 'Daily Spool File Analysis Report' dated with today's date. The report should include:

-   Executive Summary
-   Top 3 Output Queues table (queue name, library, spool file count)
-   For each of the 3 queues: worst offender users table and 3 insights
-   Recommendations section Save the PDF to /tmp/spoolfile-report.pdf

## Step 6: Email the Report

Use the `email` skill to send the PDF report:

-   To: [gjones@profoundlogic.com](mailto:gjones@profoundlogic.com)
-   Subject: 'Daily Spool File Analysis Report - \[today's date\]'
-   Body: A brief HTML summary noting the top 3 queues and that the full analysis is attached as a PDF
-   Attach: /tmp/spoolfile-report.pdf