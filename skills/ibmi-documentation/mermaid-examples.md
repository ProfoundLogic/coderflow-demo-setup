\# Mermaid Diagram Templates

  

Copy these and adapt the labels. They are known to render — keep the structure, change the names. Use \`<br/>\` for line breaks inside nodes, keep node IDs alphanumeric, and quote labels that contain special characters.

  

\## Dependency diagram (technical §5)

Layered top-down: UI → Display files → Service layer → Data layer.

\`\`\`mermaid

flowchart TD

    subgraph UI\[User Interface Layer\]

        PGM\[WRKCUST1R.PGM<br/>Customer Inquiry\]

    end

    subgraph DSP\[Display Files\]

        DSPF\[CUSTD.DSPF<br/>Customer Screen\]

    end

    subgraph SVC\[Service Layer\]

        SRV\[CUSTSVC.SRVPGM<br/>Customer Services\]

    end

    subgraph DATA\[Data Layer\]

        PF\[CUSTPF.FILE\]

        LF\[CUSTLF1.FILE\]

    end

    PGM --> DSPF

    PGM --> SRV

    SRV -->|SQL/READ| PF

    SRV -->|keyed READ| LF

\`\`\`

  

\## Call hierarchy (technical §3)

Who calls this, and what this calls. Solid = static bind, dashed = dynamic CALL.

\`\`\`mermaid

flowchart LR

    MENU\[MAINMENU.PGM\] --> PGM\[WRKCUST1R.PGM\]

    PGM ==>|bound| SRV\[CUSTSVC.SRVPGM\]

    PGM -.->|dynamic CALL| LOG\[LOGERR.PGM\]

    SRV ==>|bound| VALID\[VALIDCUST proc\]

\`\`\`

  

\## Program flow (technical §9)

Decision-aware main logic.

\`\`\`mermaid

flowchart TD

    A\[Start\] --> B\[Receive parameters\]

    B --> C{Customer found?}

    C -->|Yes| D\[Load screen fields\]

    C -->|No| E\[Send 'not found' message\]

    D --> F\[Display and read screen\]

    F --> G{F3 pressed?}

    G -->|No| F

    G -->|Yes| H\[End\]

    E --> H

\`\`\`

  

\## Entity relationship (technical §7, when useful)

Data model for the files the program touches.

\`\`\`mermaid

erDiagram

    CUSTPF ||--o{ ORDERPF : places

    CUSTPF {

        char CUSTNO PK

        char NAME

        char STATUS

    }

    ORDERPF {

        char ORDNO PK

        char CUSTNO FK

        packed AMOUNT

    }

\`\`\`

  

\## Tips

\- If a diagram fails to render, the usual cause is an unquoted special character in a label or a reserved word as a node ID — quote the label ("...") or rename the ID.

\- Keep diagrams focused: one concern per diagram. A dependency diagram that also tries to show control flow becomes unreadable.