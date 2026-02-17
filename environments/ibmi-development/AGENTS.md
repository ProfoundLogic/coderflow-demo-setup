# IBM i Development Environment

This is a Linux-based environment for IBM i development. IBM i sources are transferred to and built on IBM i, as needed.

## Working Directory
Your working directory is `/workspace`, which contains:
- `ibmi-agentic` - The IBM i source code repository and build tools.

See `/workspace/ibmi-agentic/AGENTS.md` for instructions on working with and building IBM i code.

**Important: You MUST properly sign off any IBM i sessions you create during your task**

## Exploratory Verification

For any task involving interactive IBM i display file screens, you must perform some ad-hoc exploratory verifications before the task can be considered complete. This applies both to coding and non-coding tasks that involve interactive screens.

The goal is to produce a coherent summary of your explorations, including screen renderings.

1. Come up with a list of ad-hoc tests that verify your task is complete and working. The list should cover all affected screens. Keep a "mental note" (and/or temp file) of this list.
2. For coding tasks, finish the coding work and verify all changes build successfully.
3. Use your `ibmi-interactive-session` skill to start a new session.
4. For each test case:
- Use the `ibmi-interactive-session` skill to operate the application. Interpret the screen buffer and fields information to understand what is on screen and navigate to the screen you want to test and perform any required operations.
- Keep "mental notes" (and/or temp files) of what you are doing and make sure that specific screen history file names can be correlated to each step.
- In your notes, create a text summary that explains how your exploration passed or failed the test. Use the `ibmi-interactive-session` skill to produce an HTML rendering and correlate the generated `<iframe>` tag text with your summary. Do not use basic renderings unless HTML rendering fails, or unless you are specifically asked to.
5. Review the results of your test cases.
 - If all pass, proceed to step 6.
 - If there are failures:
    - If you think you can solve them, sign off and end your IBM i session. Restart at step 2.
    - If the problems don't seem solvable, you can proceed to step 6.
6. Sign off and end your session.
7. Using your notes, prepare a final summary of all explorations, including corresponding renderings, as a temporary Markdown file. This content will be embedded directly in your final summary file, as described in section **1. Summary File** below. Use this format:

```
## Exploratory Verification Results

### Test Case 1: Title
Summary text to describe the exploration and results

<screen rendering>

### Test Case 2: Title
Summary text to describe the exploration and results

<screen rendering>
```

**Important** Make sure that screen rendering content is placed at the root of the Markdown document (i.e. not in lists, etc.) as shown above.

## Database and SQL

Use your skills to explore the database using SQL, as appropriate. Keep in mind:
- You are working in a typical IBM i development environment. A data library is included on your library list.
- It's normal that data files are not present in your build/task library.
- Don't try to query SYSTABLES to discover what table are available. Rather, look at the physical (.pf) and logical (.lf) file sources and SQL sources in the repo to determine what tables are available.
- Table layouts can be discovered by interpreting the source code. You can also query the table with your SQL skill to return the table layout metadata along with query results.
- It's not necessary to qualify table names with a schema/library in queries. Just refer to the known table names in the project and they will be found on your library list.
- Do not attempt to use any tables that are not present in the source repo.
- Do not attempt to alter existing tables unless specifically asked to.

## Output Requirements
After completing any task, you MUST create the following output files:

**Important: The `/task-output` directory is located at the SYSTEM ROOT, NOT inside `/workspace`. Ensure you write to `/task-output/...` and NOT `/workspace/task-output/...`.**

### 1. Summary File: `/task-output/summary.md`
Write a detailed summary explaining:
- The IBM i task library name. Use the value from environment variable `IBMI_BUILD_LIBRARY`.
- What you did and why
- What issues you encountered and how you resolved them
- Exploratory verification results. **Important**: Embed at the root of the `summary.md` file, i.e. not inside a list or any other element.
- Any recommendations or next steps

### 2. Commit Message: `/task-output/commit-message.txt`
Write a concise git commit message that explains what you accomplished.

## Notes
- Always run tests when available before completing a task
- Follow the existing code style in each repository
- If you make breaking changes, document them clearly in the summary
