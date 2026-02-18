---
name: Code Comments Best Practices
description: Comprehensive guidance for writing effective code comments across all languages, with IBM i / RPG-specific conventions, doc comment standards, and a decision guide.
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Code Comments Best Practices Skill

## Overview

This skill provides comprehensive guidance for writing effective code comments. It teaches when to comment, what makes a good comment, and what pitfalls to avoid. The principles apply across programming languages and help balance code clarity with appropriate documentation.

## Core Philosophy

Programs serve two audiences: machines that execute them and humans who read them. While compilers ignore comments, human readers rely on them to understand code intent and context. Quality matters more than quantity—bad comments are worse than no comments at all.

**Code tells you HOW. Comments tell you WHY.**

* * *

## The Nine Essential Rules

### Rule 1: Comments Should Not Duplicate the Code

Comments that merely restate what the code does add no value and create maintenance burden.

**Bad Example:**

```python
i = i + 1  # Add one to i
```

**Why This Is Harmful:**

-   Adds visual clutter without information
-   Takes time to write and maintain
-   Can become outdated and misleading

**When to Apply:** Remove any comment that can be understood by reading the code itself.

* * *

### Rule 2: Good Comments Do Not Excuse Unclear Code

If you need comments to explain what variables or functions do, improve the code naming instead.

**Bad Example:**

```java
private static Node getBestChildNode(Node node) {
    Node n; // best child node candidate
    for (Node node: node.getChildren()) {
        // update n if the current state is better
        if (n == null || utility(node) > utility(n)) {
            n = node;
        }
    }
    return n;
}
```

**Good Example:**

```java
private static Node getBestChildNode(Node node) {
    Node bestNode;
    for (Node currentNode: node.getChildren()) {
        if (bestNode == null || utility(currentNode) > utility(bestNode)) {
            bestNode = currentNode;
        }
    }
    return bestNode;
}
```

**Principle:** Don't comment bad code—rewrite it.

* * *

### Rule 3: If You Can't Write a Clear Comment, There May Be a Problem with the Code

Difficulty explaining code often signals that the code itself is too complex or unclear.

**Warning Sign:** Comments like "You are not expected to understand this" indicate code that needs rewriting, not documentation.

**Kernighan's Law:** Debugging is twice as hard as writing code. If you write code as cleverly as possible, you're not smart enough to debug it.

**Action Step:** If you struggle to explain code clearly, simplify the implementation rather than accepting complexity. Consider extracting a well-named function—a good function name can replace an entire comment block.

* * *

### Rule 4: Comments Should Dispel Confusion, Not Cause It

Cryptic or clever comments that require decoding defeat their purpose.

**Bad Example:**

```assembly
; RIPJSB
MOV 1750
```

(Comment abbreviates "Rest In Peace Johann Sebastian Bach" because 1750 was Bach's death year)

**Principle:** If your comment causes more confusion than it resolves, remove it entirely.

* * *

### Rule 5: Explain Unidiomatic Code in Comments

When code appears redundant or unusual but serves a specific purpose, explain why it's necessary.

**Good Example:**

```java
final Object value = (new JSONTokener(jsonString)).nextValue();
// Note that JSONTokener.nextValue() may return
// a value equals() to null.
if (value == null || value.equals(null)) {
    return null;
}
```

**When to Apply:**

-   Code that might appear unnecessary to future maintainers
-   Workarounds for language-specific quirks
-   Defensive programming that seems redundant
-   Non-obvious null checks or validation

**When NOT to Apply:**

-   Common idioms in the language (unless writing a tutorial)
-   Standard design patterns
-   Widely-understood best practices

* * *

### Rule 6: Provide Links to the Original Source of Copied Code

When using code from external sources, include the URL for full context.

**Good Example:**

```java
/** Converts a Drawable to Bitmap.
 * Via https://stackoverflow.com/a/46018816/2219998
 */
```

**Benefits of Source Links:**

-   Shows what problem was being solved
-   Reveals author credentials and reputation
-   Provides access to comments with optimizations or edge cases
-   Satisfies attribution requirements (e.g., Creative Commons)
-   Enables verification that the solution still works

**What to Link:**

-   Stack Overflow answers and questions
-   GitHub gists and repositories
-   Tutorial pages
-   Documentation that was helpful

**Remember:** Reusing code is smart; failing to credit sources wastes future maintainers' time.

* * *

### Rule 7: Include Links to External References Where They Will Be Most Helpful

Reference standards, RFCs, specifications, and documentation at the point of use.

**Good Example:**

```javascript
// http://tools.ietf.org/html/rfc4180 suggests that CSV lines
// should be terminated by CRLF, hence the \r\n.
csvStringBuilder.append("\r\n");
```

**What to Link:**

-   Technical specifications (RFCs, W3C standards)
-   API documentation
-   Design documents
-   Academic papers
-   Algorithm descriptions

**Benefit:** Readers get context exactly when and where needed, without searching through design docs.

* * *

### Rule 8: Add Comments When Fixing Bugs

Document bug fixes, workarounds, and browser/platform-specific behavior.

**Good Example:**

```java
// NOTE: At least in Firefox 2, if the user drags outside of the browser window,
// mouse-move (and even mouse-down) events will not be received until
// the user drags back inside the window. A workaround for this issue
// exists in the implementation for onMouseLeave().
@Override
public void onMouseMove(Widget sender, int x, int y) { .. }
```

**Also Good:**

```javascript
// Use the name as the title if the properties did not include one (issue #1425)
```

**What to Document:**

-   Browser-specific quirks and workarounds
-   Platform differences
-   Issue tracker references
-   Edge cases that were discovered and fixed
-   Reasoning behind the fix approach

**Why This Helps:**

-   Determines if workarounds are still needed
-   Guides testing strategies
-   Provides more context than git blame
-   Prevents regression by explaining why code exists

* * *

### Rule 9: Use Comments to Mark Incomplete Implementations

Acknowledge known limitations using standard formats like TODO, FIXME, or HACK.

**Good Example:**

```java
// TODO(hal): We are making the decimal separator be a period,
// regardless of the locale of the phone. We need to think about
// how to allow comma as decimal separator, which will require
// updating number parsing and other places that transform numbers
// to strings, such as FormatAsDecimal
```

**Standard Markers:**

-   `TODO`: Features to implement or improvements needed
-   `FIXME`: Known bugs or issues
-   `HACK`: Temporary solutions that need proper implementation
-   `NOTE`: Important context or warnings
-   `OPTIMIZE`: Performance improvement opportunities

**Best Practices:**

-   Include your name/initials for accountability
-   Reference issue tracker tickets when available
-   Explain what needs to be done and why
-   Use consistent format for searchability

* * *

## Doc Comments: Documenting Functions and Procedures

Doc comments document the public interface of functions, procedures, methods, and modules. They differ from inline comments in purpose and audience: they are written for _callers_ of the code, not maintainers of the implementation.

### What to Include in a Doc Comment

-   **Purpose:** One-sentence summary of what the function does
-   **Parameters:** Name, type, valid range, and meaning of each parameter
-   **Return value:** What is returned and under what conditions
-   **Side effects:** I/O, global state changes, database writes, etc.
-   **Exceptions/errors:** What can go wrong and when
-   **Example (optional):** A short usage example for non-obvious APIs

### What to Omit

-   Implementation details (those belong in inline comments)
-   Obvious restatements of the function signature
-   Internal variable names or logic

**Good Python Doc Comment:**

```python
def calculate_discount(price: float, tier: str) -> float:
    """
    Calculate the discounted price for a customer tier.

    Args:
        price: The original price in USD. Must be >= 0.
        tier: Customer tier. One of 'bronze', 'silver', 'gold'.

    Returns:
        The price after applying the tier discount. Returns
        the original price if tier is unrecognized.

    Raises:
        ValueError: If price is negative.
    """
```

**Bad Doc Comment:**

```python
def calculate_discount(price, tier):
    # calculates discount
```

* * *

## IBM i and RPG Commenting Conventions

IBM i programs have unique commenting syntax depending on the source type. Apply the nine rules above within these language-specific forms.

### ILE RPG Free-Form (`RPGLE`, `SQLRPGLE`)

Use `//` for single-line comments. Use `///` for **doc comments** on exported procedures (supported by tooling like VS Code RPG extension and ARCAD):

```rpgle
// Calculates net pay after deductions.
// Called after all deduction records are processed.
dcl-proc CalcNetPay;

  ///
  // Calculate net pay for an employee.
  // @param GrossAmt  Gross pay amount in USD
  // @param Deductions Total deductions
  // @return Net pay amount
  ///
  dcl-pi *n packed(11:2);
    GrossAmt    packed(11:2) const;
    Deductions  packed(11:2) const;
  end-pi;
```

Use separator comments for major logical sections:

```rpgle
//----------------------------------------------------------
// Phase 1: Validate Input Parameters
//----------------------------------------------------------
```

### Fixed-Format RPG (legacy)

Use `*` in column 7 for comment lines:

```
     * Validate customer number before processing order
     * Returns *OFF if customer is on credit hold
C                   IF        CRCUST = *BLANKS
```

### CL Programs (`CL`, `CLLE`)

Use `/* */` block comments or `//` in free-form CL:

```cl
/* Submit batch job for end-of-day processing          */
/* Only runs Monday-Friday; skipped on holidays         */
SBMJOB CMD(CALL PGM(EODPRC)) JOB(EODPRC)
```

### IBM i–Specific Comment Scenarios

**Document library list dependencies:**

```rpgle
// Requires CUSTLIB on library list for CUSTMST file access
// Add with: ADDLIBLE LIB(CUSTLIB)
```

**Document job description / activation group requirements:**

```rpgle
// Must run in named activation group MYAPP
// to share open data paths with ORDERPRC
```

**Document special values and magic numbers:**

```rpgle
dcl-c MAX_ORDERS 9999; // System table limit; see issue #342

// Order status codes (matches ORDSTS field in ORDHDR)
dcl-c STS_OPEN    '01';
dcl-c STS_SHIPPED '05';
dcl-c STS_CLOSED  '09';
```

**Document OPNQRYF / dynamic query quirks:**

```rpgle
// OPNQRYF used here instead of SQL because this program
// runs in a batch environment where SQL cursor sharing
// causes blocking with concurrent ORDPRC jobs (issue #88)
```

* * *

## Commenting AI-Generated Code

When code is generated or heavily assisted by an AI tool, add a brief note if the logic is non-obvious and you have not fully reviewed it:

```rpgle
// Logic adapted from AI suggestion — reviewed and verified
// against spec doc ORDPRC-SPEC-v3.pdf section 4.2
```

Do **not** blindly paste AI-generated code without understanding it. If you cannot explain what the code does, you cannot write a good comment for it — which is a signal to review it more carefully (see Rule 3).

* * *

## Decision Guide: Should I Add a Comment Here?

Work through these questions before adding a comment:

```
1. Can I make the code clearer without a comment?
   → Rename variables, extract a function, simplify logic first.
   → If YES → Do that instead. No comment needed.
   → If NO  → Continue.

2. Does this comment add information not in the code?
   → If NO  → Skip it.
   → If YES → Continue.

3. What type of information am I adding?
   → WHY this code exists or works this way  → Explanatory comment ✓
   → Source of copied/adapted code           → Attribution comment ✓
   → Reference to spec, RFC, or issue        → Reference comment ✓
   → A known bug, quirk, or workaround       → Warning comment ✓
   → Incomplete work                         → TODO/FIXME marker ✓
   → A function/procedure's public interface → Doc comment ✓
   → WHAT the code does (repeating code)     → Skip it ✗
```

* * *

## Comment Maintenance and Lifecycle

Comments go stale. An outdated comment is worse than no comment — it actively misleads.

**When to update comments:**

-   When you change the logic a comment describes
-   During code review (reviewer should flag mismatched comments)
-   When fixing a bug that was described in a comment
-   When a TODO/FIXME is resolved

**During refactoring:**

-   Delete comments that described code you removed
-   Update comments that described code you restructured
-   If a comment no longer makes sense, either fix it or delete it — never leave a misleading comment in place

**During code review, check:**

-   Do all comments still match the code they describe?
-   Were any comments made obsolete by this change?

* * *

## Code Review Checklist

Ordered by impact — highest priority first:

-    **Do comments explain WHY, not just WHAT?** (Most valuable category)
-    **Are workarounds, bug fixes, and non-obvious decisions documented?**
-    **Do comments still match the current code?** (Stale comments mislead)
-    **Are copied code sources attributed with links?**
-    **Are doc comments present and accurate for public functions/procedures?**
-    **Are TODOs marked with clear owner, context, and next steps?**
-    **Are external specs, RFCs, or issue references linked at point of use?**
-    **Is there redundant commenting that could be removed or replaced with better naming?**
-    **Are comments free of typos and clearly written?**

* * *

## Common Pitfalls to Avoid

1.  **Over-commenting obvious code** — Trust the reader; comment what they can't deduce
2.  **Using comments as band-aids** — Fix names and structure instead of explaining bad code
3.  **Omitting context for workarounds** — Future maintainers need to know why code exists
4.  **Missing attribution** — Wasting others' time rediscovering sources
5.  **Forgetting to update comments** — Outdated comments mislead more than help
6.  **Being too clever** — Comments should clarify, not puzzle
7.  **Leaving AI-generated logic unexplained** — Review and annotate what you don't fully own

* * *

## Comment Types Reference

Type

Purpose

Example

Explanatory

Why code exists or works a certain way

`// Retry needed: API is eventually consistent`

Attribution

Source of copied/adapted code

`// Via https://stackoverflow.com/a/12345`

Reference

Link to spec, RFC, or issue

`// See RFC 4180 for CRLF requirement`

Warning

Gotchas, edge cases, fragile code

`// Do not reorder — sequence matters`

Intent

Incomplete or future work

`// TODO(jane): Handle timezone offset`

Doc comment

Public function/procedure interface

`/// @param Amount Invoice total in USD`

* * *

## Further Resources

-   Language-specific style guides: PEP 257 (Python), JSDoc (JavaScript), Javadoc (Java)
-   IBM i: `///` doc comments with VS Code RPG extension (Code for IBM i)
-   Your team's coding standards and code review guidelines
-   Open source projects you admire — read their comments as models

**The goal:** Code that reads like well-written prose, with comments that provide valuable context machines cannot convey.