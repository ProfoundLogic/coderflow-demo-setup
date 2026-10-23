# Billing System

## Data and purpose

Support portal reporting for sales, collected revenue, receivables aging, and customer-owned products. Apply the portal user's authorized customer scope consistently to queries, totals, drill-downs, and exports.

The four tables below were verified through live column metadata in **PLDATADEV**. The requested spelling **PLDATDEV** returned `INHEADERP in PLDATDEV type *FILE not found.` Resolve this discrepancy before changing the environment's configured data library; do not change connection or build settings.

## Relevant tables and exact columns

These names, types, and descriptions come from database metadata. They establish the available fields; they do not by themselves prove uniqueness, business date semantics, or financial formulas.

### CSMASTERP — Customer master.

| Column | SQL type | Database description |
|---|---|---|
| `CMID` | DECIMAL(9,0) | Customer Id |
| `CMNAME` | CHAR(70) | Customer Name |
| `CMSALESP` | CHAR(10) | Assigned To Sales Person |
| `CMDOMAIN` | CHAR(63) | E-mail Domain Name |
| `CMPARENT` | CHAR(70) | Parent Customer |
| `CMLEADSRC` | CHAR(100) | Customer/Lead Source |
| `CMINDUSTRY` | CHAR(40) | Industry |
| `CMPEMAIL` | CHAR(60) | Primary Contact Email |
| `CMPPHONE` | CHAR(35) | Primary Conact Phone |
| `CMCRTDATE` | TIMESTAMP | Date/Time Created |
| `CMUPTDATE` | TIMESTAMP | Date/Time Updated |

### INHEADERP — Invoice and quote headers.

| Column | SQL type | Database description |
|---|---|---|
| `HDINVID` | DECIMAL(9,0) | Invoice Id |
| `HDCMID` | DECIMAL(9,0) | Customer Id |
| `HDCMNAME` | CHAR(70) | Customer Name |
| `HDQTEFLAG` | CHAR(1) | Quote Flag |
| `HDTIME` | TIMESTAMP | Time Stamp |
| `HDDTEPAID` | TIMESTAMP | Date Paid |
| `HDPAYMTHD` | CHAR(20) | Payment Method |
| `HDCMPONUM` | CHAR(20) | Purchase Order Number |
| `HDSTAXAMT` | DECIMAL(9,2) | Sales Tax Amount |
| `HDCURRENCY` | CHAR(3) | Foreign Currency Unit |
| `HDTERMS` | CHAR(50) | Terms |

### INDETAILP — Invoice and quote lines.

| Column | SQL type | Database description |
|---|---|---|
| `DTINVID` | DECIMAL(9,0) | Invoice Id |
| `DTSEQNUM` | DECIMAL(3,0) | Invoice Sequence Number |
| `DTINVTYPE` | CHAR(1) | Type L-License M-Maintenance S-Service D-Discount |
| `DTPRDID` | CHAR(20) | Product Id |
| `DTPRDEDT` | CHAR(30) | Product Edition |
| `DTDESC` | CHAR(100) | Item Description |
| `DTAMOUNT` | DECIMAL(9,2) | Amount |
| `DTQTY` | DECIMAL(7,2) | Quantity |
| `DTXAMOUNT` | DECIMAL(11,2) | Extended Amount |
| `DTMNTST` | DATE | Maintenance Start Date |
| `DTMNTEN` | DATE | Maintenance End Date |
| `DTDSCNTD` | CHAR(1) | Discounted |

### CSPDOWNDP — Products customers have purchased and own.

| Column | SQL type | Database description |
|---|---|---|
| `POCUSTID` | DECIMAL(9,0) | Customer ID |
| `POORDERID` | DECIMAL(9,0) | Order/Invoice ID |
| `POINVSQN` | DECIMAL(3,0) | Invoice Sequence Number |
| `POPRDID` | CHAR(20) | Product ID |
| `POPRDVER` | CHAR(20) | Product Version/Edition |
| `POORDDATE` | DATE | Product Order Date |
| `PORCVDATE` | DATE | Payment Received Date |
| `POPRICE` | DECIMAL(9,2) | Amount Paid |
| `POMAINT` | DECIMAL(9,2) | Maintenance Amount |
| `POMAINTEXP` | DATE | Maintenance Expiration Date |
| `POMAINDCL` | CHAR(1) | Maintenance Declined |
| `POCURRENCY` | CHAR(3) | Foreign Currency Unit |
| `POLICTYPE` | CHAR(1) | License Type |
| `POLICTERM` | CHAR(1) | License Term |
| `POPKGID` | CHAR(20) | Package Id |

## Relationships

- Invoice header to lines: `INHEADERP.HDINVID = INDETAILP.DTINVID`, mapping the user-confirmed invoice-number relationship to the actual columns.
- Customer relationships indicated by metadata: `CSMASTERP.CMID = INHEADERP.HDCMID` and `CSMASTERP.CMID = CSPDOWNDP.POCUSTID`.
- Ownership-to-invoice linkage indicated by metadata: `CSPDOWNDP.POORDERID = INHEADERP.HDINVID`; potential line linkage also uses `CSPDOWNDP.POINVSQN = INDETAILP.DTSEQNUM` with matching invoice IDs. Validate these ownership relationships and record cardinality before using them in totals.
- Verify key uniqueness and unmatched records before reporting. Do not join by customer name. Aggregate lines per invoice before combining invoice-level amounts or ownership data; one-to-many joins can multiply totals.

## Business rules and dashboard definitions

- Exclude `HDQTEFLAG = 'Y'` from invoice reporting: these records are quotes. Quote reports must be separately labeled.
- For non-quotes, set `HDDTEPAID` means collected revenue; unset means open. It is a non-nullable TIMESTAMP in the header metadata: verify the application's unset/sentinel value before writing the paid/open predicate. `IS NULL` alone will not distinguish open invoices.
- `HDTIME` is described only as Time Stamp. Verify that it represents the intended invoice date before using it for sales periods or invoice aging.
- No explicit due-date, invoice-total, or outstanding-balance column was found in INHEADERP metadata. `HDTERMS` is text, not a numeric day count. Do not invent missing columns or assume terms can always be converted to a due date.
- For line sales, `DTXAMOUNT` is the extended amount; `DTAMOUNT` is labeled Amount and `DTQTY` Quantity. Validate calculation/sign conventions before using them. `DTINVTYPE` identifies L=License, M=Maintenance, S=Service, D=Discount. Include discounts appropriately rather than silently omitting them.
- Candidate invoice amount is the sum of appropriate signed `DTXAMOUNT` values, with `HDSTAXAMT` added once only if the metric includes tax. Verify this formula against application behavior before treating it as authoritative. Group financial totals by currency (`HDCURRENCY`); do not silently combine currencies.
- Invoice sales include paid and open non-quote invoices and use the verified invoice-date basis. Collected revenue includes paid non-quotes and uses `HDDTEPAID` as the period basis, following the user's convention.
- Aging includes open non-quotes. Use verified due dates for Current/not yet due, 1–30, 31–60, 61–90, and 91+ days past due. If only invoice age is available, label it invoice age, not overdue. Keep invalid/missing dates visible and state the as-of date.
- Without a verified outstanding balance or payment history, label open totals open invoice value and disclose that partial payments/adjustments are not represented. Current status alone cannot establish historical receivables.
- Use CSPDOWNDP for owned products and maintenance reporting. Distinguish distinct products, ownership rows, versions, and license terms. `POPRICE` is Amount Paid; `POMAINT` is Maintenance Amount; `POMAINTEXP` is Maintenance Expiration Date. Do not add these ownership values to invoice sales totals or assume ownership-to-invoice joins are one-to-one.
- Reconcile dashboard totals with invoice drill-downs; verify quote exclusion, paid/open handling, customer scope, currencies, and joins before delivery.
