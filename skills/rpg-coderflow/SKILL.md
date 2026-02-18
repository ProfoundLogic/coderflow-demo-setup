---
name: RPG Coderflow Standards
description: Apply IBM i RPG ILE coding standards and best practices from the project codebase
allowed-tools:
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# RPG Coderflow Standards

Apply consistent IBM i RPG ILE coding standards and best practices based on the project codebase patterns.

## Code Format and Structure

### File Format
- Always use `**free` format RPG at the top of every RPG source file
- Use `.rpgle` extension for RPG ILE programs
- Use `.sqlrpgle` extension for RPG ILE programs with embedded SQL

### Header Comments
- Start programs with multi-line comments using `//` to describe the program purpose
- Format header comments like:
```rpgle
**free

/////////////////////
// Program Title Here
/////////////////////
```

### Control Options
- Use `ctl-opt dftactgrp(*no) actgrp(*new);` for interactive programs
- Use `ctl-opt nomain;` for service programs/modules
- Specify binding directories with `ctl-opt bnddir("BINDDIR");`
- For SQL programs, include:
  - `exec sql set option commit = *none;`
  - `exec sql set option closqlcsr = *endmod;`

## Naming Conventions

### Variables
- Use camelCase for variable names (e.g., `numCustomers`, `custError`)
- Use descriptive names that indicate purpose
- Screen field variables: prefix with `s` (e.g., `scustno`, `sname`, `saddr`)
- Counter variables: use short names like `i`, `rrn`, `msgrrn`
- Boolean/indicator variables: suffix or name to indicate true/false nature (e.g., `foundCustomer`, `validOpt`)

### Data Structures
- Use `qualified` keyword for data structures to avoid naming conflicts
- Use `template` keyword for reusable data structure definitions
- Use camelCase for data structure names
- Reference templates with `likeds()` for consistency

### Subroutines
- Use camelCase for subroutine names (e.g., `getCustomers`, `loadSFL`, `clearMSGSFL`)
- Name subroutines with verbs that describe their action

### Procedures
- Use camelCase for procedure names
- Use `export` keyword for procedures in nomain modules
- External API calls: use UPPERCASE (e.g., `QMHSNDPM`)

### File Objects
- Display files: suffix with `d` or `do` (e.g., `wrkcustd`, `wrkcustdo`)
- Physical files: suffix with `p` (e.g., `custp`)

## Declaration Patterns

### File Declarations
```rpgle
dcl-f displayfile workstn sfile(sfilename : rrn) sfile(msgsfl : msgrrn);
// Or with handler for Profound UI:
dcl-f displayfile workstn sfile(sfilename : rrn) handler("PROFOUNDUI(HANDLER)");
```

### Data Structure Declarations
```rpgle
dcl-ds dataStructName qualified;
  field1 char(10);
  field2 int(10);
end-ds;

// Template from external file:
dcl-ds record_name extname("FILENAME") qualified template end-ds;

// Using template:
dcl-ds myRecord likeds(record_name);
```

### Procedure Interface Declarations
```rpgle
dcl-proc procedureName export;
  dcl-pi *n returnType;
    param1 type const;
    param2 type;
    optionalParam type const options(*omit : *nopass);
  end-pi;
  
  // procedure code
  
end-proc;
```

### Program Entry Parameters
```rpgle
dcl-pi *n;
  paramName type const;
end-pi;
```

### Prototype Declarations
```rpgle
dcl-pr programName extpgm;
  param1 type const;
end-pr;
```

## Code Organization

### Standard Program Structure Order
1. `**free` directive
2. Header comments
3. Control options
4. File declarations
5. `/copy` statements for prototypes
6. Data structure declarations
7. Prototype declarations
8. Variable declarations
9. Main program logic
10. `*inlr = *on;` at end of main logic
11. Subroutines (begsr/endsr blocks)
12. Procedures (dcl-proc/end-proc blocks)

### Nomain Module Structure Order
1. `**free` directive
2. `ctl-opt nomain;`
3. SQL options (if applicable)
4. `/copy` statements
5. Exported procedures

## Commenting Standards

### Inline Comments
- Use `//` for single-line comments
- Place comments above code blocks to explain logic sections
- Use inline comments sparingly for complex expressions
- Example:
```rpgle
// Clear error messages.
exsr clearMSGSFL;

// Get customer list.
exsr getCustomers;
```

### Procedure Comments
- Add comments before procedures to describe their purpose
- Document parameters if not obvious from names

## Indentation and Formatting

### Indentation
- Use 2 spaces per indentation level (not tabs)
- Indent code inside control structures (if, dow, for, select, etc.)
- Indent code inside procedures
- Indent code inside subroutines

### Line Continuation
- When breaking long expressions, indent continuation lines
- Align continuation for readability:
```rpgle
saddr = %trim(customers(i).caddr1) + " " + %trim(customers(i).caddr2) + " " +
        %trim(customers(i).ccity) + ", " + customers(i).cstate + " " + customers(i).czip;
```

### Spacing
- Space around operators: `if numCustomers = 0;`
- Space after commas in parameter lists
- Space after keywords: `dow not *in03;`

## Control Flow Patterns

### Main Program Loop
```rpgle
dow not *in03;
  // main processing logic
enddo;

*inlr = *on;
```

### Conditional Processing
```rpgle
if condition;
  // code
elseif otherCondition;
  // code
else;
  // code
endif;
```

### Select Statement
```rpgle
select;
  when condition1;
    // code
  when condition2;
    // code
  other;
    // default code
endsl;
```

### For Loop
```rpgle
for i = 1 to numItems;
  // process item
endfor;
```

### Do Until
```rpgle
dou condition;
  // code
enddo;
```

## Common Patterns

### Subfile Processing
```rpgle
// Clear subfile
begsr clearSFL;
  rrn = 0;
  *in31 = *on;
  write controlRecord;
  *in31 = *off;
endsr;

// Load subfile
begsr loadSFL;
  exsr clearSFL;
  for i = 1 to numRecords;
    // populate subfile fields
    rrn += 1;
    write subfileRecord;
  endfor;
endsr;

// Read changed subfile records
readc subfileRecord;
dow not %eof(displayfile);
  if fieldChanged <> "";
    // process change
  endif;
  update subfileRecord;
  readc subfileRecord;
enddo;
```

### Error Message Subfile
```rpgle
begsr clearMSGSFL;
  msgrrn = 0;
  *in41 = *on;
  write msgcontrol;
  *in41 = *off;
endsr;
```

### Function Key Processing
```rpgle
begsr processFKeys;
  if *in03; // Exit
    *inlr = *on;
    return;
  endif;
  // other function keys
endsr;
```

### SQL Error Checking
```rpgle
exec sql
  select *
  into :variable
  from table
  where condition;
exsr checkError;

begsr checkError;
  if sqlcode < 0;
    return "Error message. SQLCODE = " + %char(sqlcode) + ", SQLSTATE = " + sqlstate;
  endif;
endsr;
```

### SQL Cursor Pattern
```rpgle
exec sql declare c1 cursor for
  select *
  from table
  where condition
  order by field;
exec sql open c1;
exsr checkError;

exec sql fetch c1 into :record;
exsr checkError;
dow returned < limit and sqlcode <> 100;
  returned += 1;
  array(returned) = record;
  exec sql fetch c1 into :record;
  exsr checkError;
enddo;
exec sql close c1;
```

### Optional Parameter Handling
```rpgle
dcl-pi *n returnType;
  required type const;
  optional type const options(*omit : *nopass);
end-pi;

dcl-s localVar like(optional);

if %parms() >= 2 and %addr(optional) <> *null;
  localVar = optional;
endif;
```

## Data Type Usage

### Common Data Types
- `char(n)` - Fixed-length character
- `varchar(n)` - Variable-length character
- `int(10)` - Integer (10-digit precision)
- `packed(n : d)` - Packed decimal
- `ind` - Indicator (boolean)
- `date` - Date field
- `time` - Time field
- `timestamp` - Timestamp field

### Type References
- Use `like(fieldName)` to reference existing field types
- Use `likeds(dsName)` to reference data structure templates
- Use `dim(n)` for arrays

## Built-in Functions

### Common BIFs Used
- `%trim()` - Trim trailing spaces
- `%char()` - Convert to character
- `%len()` - Get length
- `%elem()` - Get array element count
- `%eof()` - Check end of file
- `%parms()` - Get parameter count
- `%addr()` - Get address of variable
- `%upper()` / `%lower()` - Case conversion
- `%date()` - Date conversion
- `%char(dateField : *usa)` - Format date

## Error Handling

### Return Error Messages
- Procedures should return error messages as varchar
- Return empty string ("") on success
- Return descriptive error on failure
- Include SQLCODE and SQLSTATE in SQL error messages

### Error Display Pattern
```rpgle
error = procedureCall(params);
if error <> "";
  // display error to user
endif;
```

## Best Practices

1. **Modularity**: Break complex logic into subroutines and procedures
2. **Reusability**: Put common business logic in nomain modules with exported procedures
3. **Error Handling**: Always check for and handle errors appropriately
4. **Comments**: Comment the "why", not the "what" when code is self-documenting
5. **Const Parameters**: Use `const` for read-only parameters to prevent accidental modification
6. **Qualified DS**: Always use `qualified` for data structures to avoid naming conflicts
7. **Initialization**: Initialize variables before use when necessary
8. **Indicator Usage**: Use named indicators sparingly; prefer boolean variables with meaningful names
9. **SQL Efficiency**: Use cursors for large result sets, close cursors after use
10. **Activation Groups**: Use `actgrp(*new)` for clean program isolation
11. **Copy Members**: Use `/copy` for shared prototypes and data structures
12. **Screen Display**: Set indicators and field values before EXFMT, process after

## /copy File Patterns

### Prototype Copy File
```rpgle
// Filename: procedurename_pr.rpgle
dcl-ds record_name extname("TABLENAME") qualified template end-ds;

dcl-pr procedure1 returnType;
  param1 type const;
  param2 type;
end-pr;

dcl-pr procedure2 returnType;
  param1 type const;
end-pr;
```

## When Writing New Code

1. Check existing code patterns in the project first
2. Follow the naming conventions consistently
3. Organize code in the standard structure order
4. Use appropriate indentation and spacing
5. Add comments for complex logic sections
6. Include error handling
7. Use const for read-only parameters
8. Use qualified data structures
9. Return error messages from procedures
10. Test with actual display file interactions when applicable