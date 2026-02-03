# Attribute Extraction Prompt — FLU CIP/CDD Procedures to Excel (Attributes + Acceptable Docs)
**Filename:** `cip_cdd_attribute_extraction_prompt.md`

> **Objective:** Extract a testing-ready inventory of **CIP/CDD onboarding attributes** (target **~20**, acceptable range **18–24**) from the **FLU CIP/CDD Procedures** and produce two Excel-ready sheets:
> 1) **Attributes** (with a clear audit “Question Text” per attribute)
> 2) **Acceptable_Docs** (acceptable evidence indexed to `Attribute ID`)

This prompt is designed to create outputs that match the **example column structure** provided.

---

## 1) Role
You are a **Financial Crimes Audit Test Designer**. Your job is to transform FLU procedures into a structured testing inventory.

---

## 2) Inputs
You will receive one primary document:

- **FLU Procedures:** CIP/CDD Procedures (DOCX or extracted text)

(If additional jurisdiction procedure addenda are provided, treat them as additional “Source File(s)” and extract jurisdiction-specific attributes/documents as separate rows.)

---

## 3) Scope (CIP/CDD Onboarding only)
### In scope
Extract onboarding elements required or referenced for:
- **Customer Identification Program (CIP)** data elements and verification
- **Customer Due Diligence (CDD)** onboarding elements (including beneficial ownership where applicable)
- **Screening checks** explicitly required at onboarding (e.g., sanctions, PEP, adverse media) if procedures include them as onboarding steps
- **Evidence requirements** and **document age rules** (e.g., “within 90 days”)

### Out of scope
Do **not** include:
- Ongoing monitoring / periodic review processes unless procedures explicitly require setting the schedule *at onboarding*
- Transaction monitoring configuration, case management operations, or model governance unless directly required as part of onboarding checklist
- Unrelated compliance domains (OFAC program governance, fraud ops) unless described as onboarding steps tied to CIP/CDD

If borderline, include only if the procedure places the item inside onboarding / account-opening requirements.

---

## 4) Extraction rules (STRICT)
### 4.1 Attribute target set
- Extract **18–24** distinct onboarding attributes total.
- Prefer **atomic and testable** attributes (one concept per attribute).
- Do **not** invent attributes. Every attribute must be supported by the FLU procedures.
- If procedures imply an attribute is required but do not specify details, you may still include it, but flag uncertainty in `Notes` and set `IsRequired` based on the strongest procedure language available.

### 4.2 Attribute ID & naming
- Create `Attribute ID` in the form `A001`, `A002`, … sequential.
- Attribute names should be short and audit-friendly (e.g., “Registered Address”, “Tax Identification”, “Beneficial Owners (≥25%)”).

### 4.3 Question Text (key requirement)
Each attribute must have **one** testing question, phrased for an auditor to execute.
- Must start with a verb: “Confirm…”, “Verify…”, “Obtain…”, “Determine…”, “Document…”
- Must be specific enough that an auditor can assess pass/fail.
- If conditional (EDD/high risk), say so explicitly in the question.

### 4.4 Acceptable documents mapping
For each attribute, list **all acceptable evidence types** named in the procedures.
- One attribute can have multiple acceptable docs → multiple rows in **Acceptable_Docs**
- If procedures do not specify acceptable docs for an attribute, add **one** placeholder doc row:
  - `Document Name = TBD (Not specified in FLU)`
  - Add explanation in `Notes`
- Do not “import” acceptable docs from your own knowledge; only from the FLU text provided.

---

## 5) Populate these columns exactly (match example)

### 5.1 Sheet 1: `Attributes`
Create rows with these columns (exact headers and order):

1. `Source File`
2. `Attribute ID`
3. `Attribute Name`
4. `Category`
5. `Source`
6. `Source Page`
7. `Question Text`
8. `Notes`
9. `Jurisdiction ID`
10. `RiskScope`
11. `IsRequired`
12. `DocumentationAgeRule`
13. `Group`

#### Column guidance
- **Source File:** the filename or document label provided (e.g., `CIP_CDD_Procedures.docx`). If multiple documents, use the correct file per row.
- **Category:** choose one of (use exactly these values):
  - `Entity Profile`
  - `Individual Profile`
  - `Ownership`
  - `Documentation`
  - `AML`
  - `EDD`
  - `Compliance`
  - `Registration`
- **Source:** procedure chapter/section/control name (e.g., “Customer Identification Program > Required Information” or control ID if present)
- **Source Page:** use a page number if provided by the text extraction; otherwise use paragraph locator like `para 12`. Do not guess.
- **Jurisdiction ID:** if the FLU is global, use `ENT` for entity onboarding or `IND` for individuals where relevant; if the FLU specifies a jurisdiction, use that (e.g., `UK`, `CA-ON`, etc.). If unclear, default to `ENT` and note ambiguity.
- **RiskScope:** one of `Base`, `EDD`, `Both`
- **IsRequired:** `Y` or `N` only
- **DocumentationAgeRule:** numeric day count if stated (e.g., 90 / 365 / 730). Blank if not specified.
- **Group:** one of:
  - `Individuals`
  - `Entity`
  - `Beneficial Owner`
  - `Screening`
  - (If procedures define other groups, you may add them, but keep the values short.)

### 5.2 Sheet 2: `Acceptable_Docs`
Create rows with these columns (exact headers and order):

1. `Source File`
2. `Attribute ID`
3. `Document Name`
4. `Evidence Source/Document`
5. `Jurisdiction ID`
6. `Notes`

#### Column guidance
- **Document Name:** a clean doc label (e.g., “Certificate of Incorporation”, “Utility Bill”, “Passport Copy (Beneficial Owner)”)
- **Evidence Source/Document:** the evidence artifact name as written in procedures (may match Document Name; keep consistent)
- **Notes:** include constraints (e.g., “Certified copy”, “Within 90 days”, “Government issued”, “EDD only”)

---

## 6) Source evidence requirements (citations)
Every row in both sheets must be traceable to the FLU procedures.

### For `Attributes` rows:
- `Source` must reference the section/control name
- `Source Page` must be a page number if available; otherwise a paragraph locator (e.g., `para 18`)

### For `Acceptable_Docs` rows:
- Use the same `Source File` and `Jurisdiction ID` conventions as the attribute row.
- If acceptable docs appear in a different section than the attribute, you may still map them, but the mapping must be supported by the FLU text.

If you cannot locate support for something you believe is implied:
- Keep the attribute if clearly required
- Set `Source Page` to `NOT FOUND`
- Add an explanatory note in `Notes`
- Add the placeholder doc row for acceptable docs (TBD)

---

## 7) Output format (Excel-ready; STRICT)
Return **two artifacts**:

### Artifact A — JSON workbook spec (primary)
Return a single JSON object named `workbook` using this structure:

```json
{
  "workbook": {
    "title": "CIP/CDD Onboarding — Attributes and Acceptable Documents",
    "generated_at": "YYYY-MM-DD",
    "sheets": [
      {
        "name": "Attributes",
        "freeze_panes": {"row": 1, "col": 0},
        "columns": [
          {"header":"Source File","width":18},
          {"header":"Attribute ID","width":12},
          {"header":"Attribute Name","width":28},
          {"header":"Category","width":18},
          {"header":"Source","width":18},
          {"header":"Source Page","width":12},
          {"header":"Question Text","width":60},
          {"header":"Notes","width":22},
          {"header":"Jurisdiction ID","width":14},
          {"header":"RiskScope","width":12},
          {"header":"IsRequired","width":10},
          {"header":"DocumentationAgeRule","width":20},
          {"header":"Group","width":14}
        ],
        "rows": [],
        "styles": {
          "header": {"bold": true, "wrap": true, "valign": "top"},
          "table": {"filter": true},
          "wrap_columns": ["Question Text","Notes","Source"]
        }
      },
      {
        "name": "Acceptable_Docs",
        "freeze_panes": {"row": 1, "col": 0},
        "columns": [
          {"header":"Source File","width":18},
          {"header":"Attribute ID","width":12},
          {"header":"Document Name","width":32},
          {"header":"Evidence Source/Document","width":32},
          {"header":"Jurisdiction ID","width":14},
          {"header":"Notes","width":28}
        ],
        "rows": [],
        "styles": {
          "header": {"bold": true, "wrap": true, "valign": "top"},
          "table": {"filter": true},
          "wrap_columns": ["Notes","Document Name","Evidence Source/Document"]
        }
      }
    ]
  }
}
```

**JSON rules:**
- Each `rows[]` entry must be an object with keys matching the headers **exactly**
- No nested objects inside cells
- Keep attributes within **18–24**
- `Attribute ID` must be sequential with no gaps
- Every `Acceptable_Docs` row must reference a valid `Attribute ID`

### Artifact B — TSV fallbacks (secondary)
After the JSON, output:
1) `## TSV — Attributes`
2) `## TSV — Acceptable_Docs`

Each TSV must:
- include the header row first (exact headers)
- be tab-separated
- match the JSON content

---

## 8) Quality checks before final output
- Exactly two sheets: `Attributes` and `Acceptable_Docs`
- 18–24 attribute rows in `Attributes`
- All `Acceptable_Docs.Attribute ID` values exist in `Attributes`
- `IsRequired` uses only `Y`/`N`
- `RiskScope` uses only `Base`/`EDD`/`Both`
- `DocumentationAgeRule` is numeric days or blank
- No duplicate Attribute IDs or mismatched headers

---

## 9) Response format (STRICT)
Your response must contain **exactly** these sections, in this order:

1) `## JSON Workbook` (JSON only)
2) `## TSV — Attributes` (TSV only)
3) `## TSV — Acceptable_Docs` (TSV only)

No other narrative.

---

## 10) Start now
Read the FLU CIP/CDD Procedures and produce the two-sheet workbook outputs per Sections 5–9.
