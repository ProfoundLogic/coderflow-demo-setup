---
name: ibmi-interactive-session
description: Run an IBM i interactive session to execute and test applications.
---

# IBM i Interactive Sessions

Operate IBM i interactive sessions via Profound UI / Genie using the provided scripts.

Genie is a TN5250 emulator that also has support for Profound UI Rich Display File (RDF) data streams.

## Session Flow

1. Start session
2. Get initial screen state, check data stream type, and check if Display Program Messages screen appears
3. If Display Program Messages screen is shown, press Enter to bypass it
4. Get current screen state and determine data stream type
5. Read current screen state
6. Respond to screen
7. Repeat steps 4-6 as needed
8. End session

## Using Scripts

- Scripts are contained in the same directory as this file.
- Do not read the provided scripts. Just execute them as instructed.
- All scripts require a session name as the first argument. Choose a session name (e.g., `SessionA`) and use it consistently across all script calls for that session.

## Starting a Session

**IMPORTANT**: If the script fails with a message about required environment variables not being set, or due to HTTP 401, DO NOT TROUBLESHOOT. Stop and report the error.

Run the `./genie_start.sh` script with your chosen session name:

```bash
./genie_start.sh SessionA
```

This starts the session and saves the initial screen state. **The script authenticates automatically**, so you should NOT expect to see a sign-on display after starting a session. If a sign-on display appears after starting, this indicates a problem and you must end the session using the `./genie_end.sh` script.

**Success output:** The script outputs two lines:
- `SessionA started`
- `Screen history: screen-001.json` - The filename of the initial screen saved to history

**After starting a session, you MUST:**
1. Use `./genie_get.sh` to retrieve the initial screen state
2. Check the data stream type - DO NOT assume you know what it will be
3. Check what screen actually appears - DO NOT assume you know what it will be
4. Look for the Display Program Messages screen (see section below) and bypass it if present

## Getting Current Session State and Determining Data Stream Type

Use the `./genie_get.sh` script to retrieve the current screen state:

```bash
./genie_get.sh SessionA
```

This outputs a JSON representation of the current screen state. Parse with `jq` as needed.

**Important: before trying to interpret and respond to a screen, you MUST discover the data stream type.**

Screen responses can be in one of two data stream formats: **5250** or **RDF** (Rich Display File). Applications may use either format exclusively, or switch between them during a session. You must detect the format after each screen response and interpret/respond appropriately.

Check for the presence of specific top-level keys in the JSON response:

- **5250 format**: Response contains a `"5250"` key at the root level
- **RDF format**: Response contains a `"layers"` key at the root level (without a `"5250"` key)

To check for a 5250 data stream:

```bash
./genie_get.sh SessionA | jq -r '.["5250"]'
```

To check for an RDF data stream:

```bash
./genie_get.sh SessionA | jq -r '.["layers"]'
```

## Handling Display Program Messages Screen

After starting a session, a **Display Program Messages** screen may appear before your initial application or menu. **This is completely normal** and happens when another session is already active using the same user profile. The other session may be unrelated to your task (for example, in environments using shared user profiles).

**Example Display Program Messages screen:**
```
                           Display Program Messages

 Job 520962/DRAGENT/QPADEV001G started on 11/13/25 at 18:31:44 in subsystem Q
 Message queue DRAGENT is allocated to another job.

 Press Enter to continue.

 F3=Exit   F12=Cancel
```

**How to identify this screen:**
- Data stream type is 5250
- Title line contains "Display Program Messages"
- Contains informational messages about job or session state
- Shows instruction "Press Enter to continue."
- Function keys shown: F3=Exit, F12=Cancel

**What to do:**
Simply bypass this screen by pressing Enter:
```bash
./genie_put.sh SessionA "crow=1&ccol=1&aid=241"
```

After pressing Enter, retrieve the screen state again to see your actual starting application or menu.

## Reading 5250 Screen Content

Use `jq` to parse the screen data from the `./genie_get.sh` script:

```bash
# View the entire screen buffer
./genie_get.sh SessionA | jq -r '.["5250"].buffer[]'

# Extract specific field data
./genie_get.sh SessionA | jq '.["5250"].layers[0].fields[] | select(.type=="I")'
```

## Understanding 5250 Screen JSON

**Layers**: Array at `.["5250"].layers` always has at least one entry. Index `0` is the main screen. Others correspond to windows. You can only enter data into the top-most layer.

**Screen Size:** TN5250 screens are either 24x80 (24 rows, 80 columns) or 27x132. Properties `width` and `height` on the `.["5250"].layers` elements give the main screen and window sizes.

**Screen Buffer:** The screen buffer at `.["5250"].buffer[]` contains a text representation of the screen.
This helps to quickly visualize what is on screen, but does not include information such as entry field locations
or display attributes.

**Fields:** Array at `.["5250"].layers[0].fields[]` has information about screen fields.

**Field Types:** `"O"` (Output/constant text), `"I"` (Input/entry field)

**Key Field Properties:** `row`/`col` (position), `data` (content), `idx` (entry field number for POST data), `attr` (display attribute), `wrapped` (field wraps screen edge)

**Example:** Entry field with `"idx": 0` → send data as `0=value` in POST data.

## 5250 Screen User Interface

5250 screens are submitted by entering data into fields and pressing a response (AID) key.

### Response Key Labels

IBM i screens show available keys at the bottom (e.g., `F3=Exit`, `Cmd04=Prompt`, `CF06-Add`). Enter is almost always valid. Label style varies by application.

**List navigation:** `More...` or `+` indicates PAGEDOWN (aid=245) available. `Bottom` = end of list.

### Error Messages

Error messages appear in the screen buffer or at `.["5250"].error` in the JSON (rendered as line 25/28 by TN5250 emulators).

## Responding to 5250 Screens

Each response requires POST fields:

- **crow/ccol**: Required. These must be set to a valid row/col within the top-most layer. Some screens implement field-specific function key behavior using these values. Typically this is used with `F4=Prompt` or `Help` keys. If field-specific behavior is not needed, then any valid row/col position within the top-most layer can be used.
- **aid**: Required. Response key code.
- **entry field values** Optional. Given as `<idx>=<value>`, using the `idx` number from the entry field item.

Use the `./genie_put.sh` script to send responses:

```bash
./genie_put.sh SessionA "<POST_DATA>"
```

Replace `<POST_DATA>` with the appropriate data for your response. After sending a response, use `./genie_get.sh SessionA` to retrieve the new screen state.

**Success output:** The script outputs three lines:
- `Response sent successfully`
- `POST history: post-NNN.txt` - The filename of the POST data saved to history
- `Screen history: screen-NNN.json` - The filename of the resulting screen saved to history

### POST Data Examples

**Enter data in field 0, cursor at row 20 col 9, press Enter:**
```
0=90&crow=20&ccol=9&aid=241
```

**Press Enter with cursor at row 4 col 2:**
```
crow=4&ccol=2&aid=241
```

**Press F3 (exit) with cursor at row 1 col 1:**
```
crow=1&ccol=1&aid=51
```

**Multiple field entry (e.g., library and file name):**
```
0=MYLIB&1=MYFILE&crow=10&ccol=5&aid=241
```

### Response Key Codes (aid values)

- ENTER: `241`
- F1-F12: `49`-`60`
- F13-F24: `177`-`188`
- PAGEUP (ROLLDOWN): `244`
- PAGEDOWN (ROLLUP): `245`
- HELP: `243`
- PRINT: `246`
- CLEAR: `189`

## Understanding RDF Screen JSON

### Layers

Array at `.layers` contains screen layers. Index `0` is the main screen. Subsequent indices correspond to windows. You can only interact with the top-most layer.

### Formats

Array at `.layers[N].formats[]` contains screen segments (record formats). Each format has:

- `name`: Format identifier (e.g., "CUSTCTL", "CUSTFOOT")
- `active`: Boolean indicating if this format's response indicators are active
- `data`: Object containing field values
- `metaData`: Object containing UI element definitions
- `subfiles`: Object containing subfile data (if present)

### Active Format

Only one format per layer has `active: true`. This is the format whose response indicators (function keys) must be submitted when responding to the screen.

### Data

Field values are stored at `.layers[N].formats[].data` as key-value pairs where the key is the field name.

### MetaData Items

UI element definitions are at `.layers[N].formats[].metaData.items[]`. Each item represents a screen element with properties including:

- `id`: Element identifier (often matches field name)
- `field type`: Type of element (see Field Types below)
- `value`: Field value definition or static value
- `left`, `top`, `width`, `height`: Position and size in CSS units (pixels)
- `shortcut key`: Associated keyboard shortcut (e.g., "Enter", "F3")
- `response`: Response indicator definition for function keys
- `css class`: Styling classes

### Field Types

Common field types in `.metaData.items[]`:

| Field Type | Description |
|------------|-------------|
| `output field` | Display-only text or value |
| `textbox` | Text input field |
| `hyperlink` | Clickable link (often with shortcut key) |
| `grid` | Subfile/table display |
| `image` | Image element |

```bash
# Find all input fields (textboxes)
./genie_get.sh SessionA | jq '[.layers[0].formats[] | select(.active) | .metaData.items[] | select(."field type" == "textbox") | .id]'
```

### Response Elements

Elements that trigger screen responses have `shortcut key` and/or `response` properties:

- `shortcut key`: The key that activates this element (e.g., "Enter", "F3", "F11")
- `response`: Indicator definition with `fieldName` identifying the response indicator

```bash
# Find all response elements in the active format
./genie_get.sh SessionA | jq '[.layers[0].formats[] | select(.active) | .metaData.items[] | select(."shortcut key") | {id, "shortcut key": ."shortcut key", response_indicator: .response.fieldName}]'
```

### Subfiles

Subfiles (record listings/grids) are at `.layers[N].formats[].subfiles`. Each subfile contains:

- `field names`: Array of field names corresponding to data columns
- `data`: Array of record arrays (each record is an array of values in field name order)

```bash
# Get subfile structure
./genie_get.sh SessionA | jq '.layers[0].formats[] | select(.active) | .subfiles | keys'

# Get subfile field names and record count
./genie_get.sh SessionA | jq '.layers[0].formats[] | select(.active) | .subfiles.CUSTSFL | {"field names": ."field names", record_count: (.data | length)}'

# Get first record with field names
./genie_get.sh SessionA | jq '.layers[0].formats[] | select(.active) | .subfiles.CUSTSFL | [."field names", .data[0]] | transpose | map({(.[0]): .[1]}) | add'
```

The `field names` array defines the column order. Each record in `data` is an array of values matching this order. Subfile fields typically include option input fields (e.g., "SOPT") and display fields.

## Responding to RDF Screens

Each response requires POST fields submitted via the `./genie_put.sh` script.

### POST Data Components

**CRITICAL: The POST field names are case-sensitive and MUST be specified in the correct case. You MUST use the case of the names in the `format` column below to infer the correct case of every POST field name you generate. For example, FORMAT, SUBFILE, and FIELD names MUST be specified in UPPERCASE. On the other hand, names like `aid`, `rrn`, `row`, and `col` MUST be specified in lowercase.**

**CRITICAL: The JSON metadata returned by `./genie_get.sh` may represent field names or indicators in lowercase (e.g., `*in03`, `custno`). You MUST ignore the casing in the JSON and strictly convert these names to UPPERCASE when creating your POST data (e.g., `*IN03`, `CUSTNO`)**

| Component | Format | Description |
|-----------|--------|-------------|
| Field values | `{FORMAT}.{FIELDNAME}=value` | Can be submitted for any format in the topmost layer |
| Response indicators | `{FORMAT}.{INDICATOR}=0\|1` | Submit for active format only (see below) |
| AID code | `aid={code}` | Response key code |
| Cursor position | `row={n}&column={n}` | Cursor row and column |
| Subfile top RRN | `toprrn.{n}=1` | Top record for subfile n (always 1 for headless operation) |
| Subfile field | `{SUBFILE}.{FIELD}.{rrn}=value` | Subfile field value with 1-based RRN |
| Subfile record changed indicator | `{SUBFILE}.rrn={rrn}` | Multiple occurrence. 1-based RRN that indicates to backend to process field data submissions for this record. You MUST submit one occurence for each subfile record you submit field/indicator values for. |

### Response Indicators (Non-Subfile)

Response indicators are associated with function keys in the active format. When responding:

- **ALL** response indicators in the active format must be submitted with every response
- Set indicators to `0` (off) by default
- Set to `1` (on) only for the indicator being "pressed"

```bash
# Find all response indicators in the active format
./genie_get.sh SessionA | jq '[.layers[0].formats[] | select(.active) | .metaData.items[] | select(.response) | {id, "shortcut key": ."shortcut key", indicator: .response.fieldName}]'
```

### Subfile Input

To enter data into a subfile record:

- **Field value**: `{SUBFILE}.{FIELD}.{rrn}=value` - The RRN is 1-based (first record = 1)
- **Record changed indicator**: `{SUBFILE}.rrn={rrn}` - Indicates to the backend to process field data changes for this record
- **Subfile response indicators**: Only submit for changed records (unlike non-subfile indicators)

### Valid Responses

A valid response must include either:
- A response indicator set to `1`, OR
- An AID code, OR
- Both

Enter (aid=241) is always valid, even if there is no corresponding link or button on screen.

### POST Data Examples

**Enter data in a field, press Enter:**
```
CUSTCTL.SFILTER=smith&CUSTCTL.*IN03=0&aid=241&row=4&column=35&toprrn.1=1
```

**Press F3 (exit) - set response indicator to 1:**
```
CUSTCTL.*IN03=1&aid=51&row=1&column=1&toprrn.1=1
```

**Clear a field value:**
```
CUSTCTL.SFILTER=&CUSTCTL.*IN03=0&aid=241&row=4&column=35&toprrn.1=1
```

**Select subfile record 4 with option 5:**
```
CUSTCTL.*IN03=0&CUSTSFL.SOPT.4=5&CUSTSFL.rrn=4&aid=241&row=12&column=3&toprrn.1=1
```

**Multiple subfile records (changed records only):**
```
CUSTCTL.*IN03=0&CUSTSFL.SOPT.2=5&CUSTSFL.SOPT.4=5&CUSTSFL.rrn=4&aid=241&row=12&column=3&toprrn.1=1
```

### Response Key Codes (aid values)

- ENTER: `241`
- F1-F12: `49`-`60`
- F13-F24: `177`-`188`
- PAGEUP (ROLLDOWN): `244`
- PAGEDOWN (ROLLUP): `245`
- HELP: `243`
- PRINT: `246`
- CLEAR: `189`

## Best Practices

**Always verify screen state before making assumptions:**
- Use `./genie_get.sh` to check the data stream type and what screen is actually displayed
- Do NOT assume you know what data stream type or screen will appear after any operation
- Read the actual screen content and respond based on what you see
- Different environments and applications may have different screen flows
- Let the actual screen state guide your actions, not assumptions about what "should" appear

## Ending a Session

### Step 1: Exit Applications and Sign Off

- Exit all applications to return to user's initial menu. Instructions for exiting application are usually printed on screen. Typically `F3=Exit`, but this can vary by application.
- Once back to something that appears to be a menu, look for an option to sign off and use it.

If it's not clear how to get signed off (i.e. no obvious Exit or Signoff options on screen), then you may proceed to Step 2, but always make an attempt to at least look for Exit/Signoff options on screen.

After successfully completing this step, a Sign On display will show. This indicates you are successfully signed off and can proceed to Step 2.

### Step 2: End Session (required)

Use the `./genie_end.sh` script:

```bash
./genie_end.sh SessionA
```

This ends the session. The session histories remain available for inspection.

**Success output:** `SessionA ended successfully`

## Session State and History

Session state and history are stored in directory `/tmp/genie-sessions/<session-name>`. Contents:

- `session_id.txt` - Presence of this file indicates a session is active. Contains the session id.
- `session.json` - Current screen state.
- `history` - History directory. Contents:
  - Screen state history files named like `screen-001.json`, `screen-002.json`, etc.
  - Response POST data history files named like `post-001.txt`, `post-002.txt`, etc.

  **File numbering:** `screen-001.json` is the initial screen (created by `genie_start.sh`). Each subsequent `genie_put.sh` operation creates both a POST file and a screen file. The POST file uses the counter before the operation (e.g., `post-001.txt`), and the screen file uses the counter after incrementing (e.g., `screen-002.json`). Therefore, `post-NNN.txt` corresponds to `screen-NNN+1.json`.

  All contents are retained after session end except for `session_id.txt`.

## Screen Renderings

You may be asked to produce renderings of screens.

### HTML Renderings (Recommended)

Use the `./genie_html.sh` script to generate HTML iframe renderings of screen history files:

```bash
./genie_html.sh SessionA screen-003.json
```

This outputs an iframe element that can be used to display the screen rendering.

**Important:** If the script indicates that HTML rendering is not supported in the environment, fall back to basic renderings instead.

### Basic Renderings

Use basic renderings when HTML rendering is not supported or when specifically requested.

#### 5250 Screens

Display the buffer directly:

```bash
./genie_get.sh SessionA | jq -r '.["5250"].buffer[]'
```

#### RDF Screens

RDF screens have no buffer. Construct a text visualization from these data sources:

1. **Static text/labels**: `.layers[N].formats[].metaData.items[]` where `.value` is a string
2. **Field values**: `.layers[N].formats[].data` object (keyed by field name)
3. **Subfile data**: `.layers[N].formats[].subfiles.{NAME}` with `."field names"` array and `.data` array
4. **Action links**: `.layers[N].formats[].metaData.items[]` where `."field type"` is `"hyperlink"` (e.g., "Continue", "Exit")

MetaData items may include positioning properties (e.g., `top`, `left`) or other hints that can help infer layout structure. RDF screens vary widely, so examine the available properties and adapt the visualization accordingly.

**Example: Extract subfile data**

```bash
./genie_get.sh SessionA | jq -r '
  .layers[0].formats[] | select(.active) | .subfiles.CUSTSFL |
  ."field names" as $f | .data[] |
  "\(.[3])  \(.[5])  \(.[4])"
'
```

Adapt field indices based on the `"field names"` array for each subfile.

## Multiple Concurrent Sessions

Multiple sessions can run simultaneously by using different session names:

```bash
# Start two sessions
./genie_start.sh SessionA
./genie_start.sh SessionB

# Work with SessionA
./genie_get.sh SessionA
./genie_put.sh SessionA "crow=1&ccol=1&aid=241"

# Work with SessionB
./genie_get.sh SessionB
./genie_put.sh SessionB "0=VALUE&crow=5&ccol=2&aid=241"

# End both sessions
./genie_end.sh SessionA
./genie_end.sh SessionB
```
