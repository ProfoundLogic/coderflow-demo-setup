---
name: ibmi-clcmd
description: Execute IBM i CL (Control Language) commands via SSH
createdAt: 2026-09-24T12:55:16.688Z
createdBy: rbetancourt
createdById: user_1767620468211_32t18oh94
createdByName: Roger Betancourt
updatedAt: 2026-09-24T12:55:16.688Z
updatedBy: rbetancourt
updatedById: user_1767620468211_32t18oh94
updatedByName: Roger Betancourt
---

## Quick Start

Execute IBM i CL commands using the standard `ssh` command and the PASE `system` utility:

```bash
ssh user@host "system 'DSPLIBL'"
```

The `system` utility on IBM i PASE allows you to execute native CL commands and returns the output to stdout/stderr.

---

## Examples

### Display Library List
```bash
ssh user@host "system 'DSPLIBL'"
```

### Work with Active Jobs in QINTER Subsystem
```bash
ssh user@host "system 'WRKACTJOB SBS(QINTER)'"
```
---

## References

**IBM i Documentation:**
- [PASE system utility](https://www.ibm.com/docs/en/i/7.5.0?topic=utilities-pase-i-system-utility)

