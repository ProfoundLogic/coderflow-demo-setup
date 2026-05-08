# pui.submit() contract

Profound UI's `pui.submit()` is how the EJS layer hands control back to the RPG. Get this wrong and clicks silently do nothing.

## The signature

```js
pui.submit({ <field-name>: <value>, ... });
```

The argument is an object map of field-name → override value. Profound UI merges these into the screen format's data buffer before submitting.

## Top-level format fields — straightforward

```js
pui.submit({ action: 'EXIT' });
pui.submit({ action: 'SEARCH', sfilter: 'acme' });
```

Profound's runtime sets the named field on the active record format and submits.

## Subfile cell overrides — the gotcha

For subfile cells the key syntax is `subfile.field.rrn` (1-based RRN):

```js
pui.submit({ action: 'OK', 'custsfl.sopt.6': '5' });
```

**Critical**: this alone is not always reliable. You also need a hidden `<input>` in the DOM with the matching name, so Profound's serializer has something to read for that subfile cell.

## The dual requirement (mandatory pattern)

Every subfile cell that can be set from JS must have **both**:

1. A hidden input in the EJS template:
   ```html
   <input type="hidden" name="custsfl.sopt.<%= row._rrn %>" value="<%= row.sopt %>">
   ```
2. The override map passed to `pui.submit`:
   ```js
   pui.submit({ action: 'OK', ['custsfl.sopt.' + rrn]: '5' });
   ```

Either alone will appear to work in some cases and silently fail in others. Always do both.

## Recommended row-click handler

For "click anywhere on a row to drill in":

```js
function wireRowClick() {
  Array.from(document.querySelectorAll('tr.row-click')).forEach(function (row) {
    row.addEventListener('click', function (event) {
      // Skip clicks on inputs, links, buttons (interactive children).
      if (event.target.closest('input, a, button')) return;
      // Skip when text is being selected.
      var sel = window.getSelection && window.getSelection();
      if (sel && sel.toString().length > 0) return;

      var rrn = row.dataset.rrn;
      if (!rrn) return;
      if (!window.pui || typeof window.pui.submit !== 'function') return;

      var overrides = { action: 'OK' };
      overrides['custsfl.sopt.' + rrn] = '5';

      // Defense-in-depth: also set the hidden input value.
      var optInput = row.querySelector('input[name="custsfl.sopt.' + rrn + '"]');
      if (optInput) optInput.value = '5';

      try {
        window.pui.submit(overrides);
      } catch (err) {
        // Fallback if the override map is rejected.
        window.pui.submit({ action: 'OK' });
      }
    });
    row.style.cursor = 'pointer';
  });
}
```

## Common mistakes

| Mistake | Symptom |
|---|---|
| Setting `input.value = '5'` only, no override map | Click submits but RPG sees `sopt=''` |
| Override map only, no hidden input | Inconsistent: works in some Profound UI versions, silently fails in others |
| Wrong RRN (0-based instead of 1-based) | "No selection" or wrong record drilled |
| Missing hidden `action` input on the form | `pui.submit({action: 'X'})` may not propagate |
| Calling `pui.submit` before Profound's runtime has loaded | TypeError; always check `typeof window.pui.submit === 'function'` |

## Hidden ACTION input

Always include this on every primary record format's EJS template:

```html
<input type="hidden" name="action" value="">
```

Profound writes the override into this input before submission. Without it, override propagation is unreliable.

## Why this is fiddly

`pui.submit` accepts overrides AND reads form fields. Different Profound UI versions and screen-format types prefer one path or the other. Doing both is the only consistently working pattern across versions.
