# IBM i Development Environment

This is a Linux-based environment for IBM i development. IBM i sources are transferred to and built on IBM i, as needed.

## Working Directory

Your working directory is `/workspace`, which contains:

-   `workspace/ibmi-agentic` - The IBM i source code repository and build tools.

Note the nesting: the repository is at `/workspace/workspace/ibmi-agentic`, and its
`docs/` subdirectory is **both** the git working tree root and the codermake project
root. Run all `git` and `codermake` commands from
`/workspace/workspace/ibmi-agentic/docs`. Running codermake one level up fails with a
misleading `No rule to make target 'docs/qddssrc/hellod.dspf'`.

See `/workspace/workspace/ibmi-agentic/docs/AGENTS.md` for instructions on working with and building IBM i code.

## Task Bootstrap: rebuild the demo menu

Each task gets a brand-new IBM i library (`$IBMI_BUILD_LIBRARY`) that is dropped when
the task ends, so nothing built in a previous task survives. The menu a 5250 session
displays is a compiled `*MENU` object resolved through the library list. Without a
build it resolves to the stale copy in `AIDEMOBASE`, which does not reflect the
checked-out branch — a `git checkout` changes source files in the container and
nothing at all on the IBM i.

**Near the start of every task, before any interactive IBM i work, run:**

```bash
cd /workspace/workspace/ibmi-agentic/docs
if ! ssh dev "system 'CHKOBJ OBJ($IBMI_BUILD_LIBRARY/MENU) OBJTYPE(*MENU)'" >/dev/null 2>&1; then
  rm -f build/menu.menu build/menu.file build/menu.msgf build/goperp.pgm
  codermake menu.menu
fi
```

This builds the branch's own menu into `$IBMI_BUILD_LIBRARY`, which precedes
`AIDEMOBASE` in the library list and therefore shadows the stale copy. It is
branch-correct by construction: on `PERP-Demo-RB` the menu includes option 4 "PERP
Demo" (bridging to `PERPDEMO/PERPMNU` via `GOPERP`), and on branches without that
source the option is simply absent. It takes a few seconds and `menu.menu` has no
data-file prerequisites, so it is cheap and safe.

Three rules that are not optional:

-   **Keep the `CHKOBJ` guard.** `CRTDSPF` has no `REPLACE` parameter, so rebuilding
    `menu.file` when the object already exists fails with `CPF5813`. The guard makes
    the step idempotent within a task.
-   **Delete only those four markers — never `rm build/*`.** A blanket delete makes
    codermake rebuild `custp.file`, creating an empty `CUSTP` in the task library that
    shadows the populated copy in `AIDEMOBASE` and breaks the customer options.
-   **The `rm` is required, not defensive.** The markers under `build/` are empty
    files left by a build against a *different* library, and they are not
    library-qualified. Without deleting them codermake reports "everything is up to
    date" while the task library is empty.

Sign on to 5250 **after** the build: a session keeps whatever menu it resolved at
sign-on time, so a session opened earlier will still show the old menu.

## Notes

-   Always run tests when available before completing a task
-   Follow the existing code style in each repository
-   If you make breaking changes, document them clearly in the summary
