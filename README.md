# Email Automation Pipeline — Google Apps Script

> Automated email extraction, filtering, and documentation system built with Google Apps Script.
> Reduced 3–4 hours of daily manual processing to 1.5–2 hours — a 50%+ time saving.

---

## The Problem

Managing a high-volume support email workflow manually required significant daily effort:

- Opening a shared Gmail mailbox and manually scanning for relevant requests
- Filtering emails by request type, sender, subject, and date range
- Categorising each request and documenting outcomes in a structured format
- Compiling a daily summary report for the operations team

This process consumed **3–4 hours every single day** — time that could be spent on higher-value work.

---

## The Solution

A Google Apps Script automation pipeline that connects to Gmail, processes the mailbox automatically, and outputs structured data to Google Sheets — ready for review and action.

### What it does

1. **Connects to Gmail** via the Apps Script Gmail service — no manual login required
2. **Filters emails** based on configurable criteria: subject keywords, sender domain, date range, label
3. **Categorises requests** automatically using pattern matching rules
4. **Populates a Google Sheet** with clean, structured, filtered data — one row per email
5. **Generates a summary section** with counts by category for daily reporting

---

## Impact

| Metric | Before Automation | After Automation | Improvement |
|---|---|---|---|
| Daily processing time | 3–4 hours | 1.5–2 hours | **50%+ reduction** |
| Manual categorisation | 100% manual | Automated | Eliminated |
| Error rate | Occasional misfiles | Consistent | Reduced |
| Report readiness | End of processing | Instant | Same-day |

---

## How It Works

```
Gmail Mailbox
      │
      ▼
  fetchEmails()          ← Connects to Gmail, retrieves messages by filter criteria
      │
      ▼
  filterAndCategorise()  ← Applies keyword rules to assign category to each email
      │
      ▼
  writeToSheet()         ← Outputs structured rows to Google Sheets destination
      │
      ▼
  generateSummary()      ← Appends daily count summary by category
```

The script is triggered on a time-based schedule (Apps Script trigger) — runs automatically each morning before the workday starts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Google Apps Script (JavaScript) |
| Email access | Gmail API via Apps Script GmailApp service |
| Output | Google Sheets API via Apps Script SpreadsheetApp service |
| Scheduling | Apps Script time-based triggers |
| Configuration | Script Properties (for filter keywords and sheet IDs) |

---

## Setup

### Prerequisites
- A Google account with access to Gmail and Google Sheets
- The mailbox you want to process (can be your own or a shared mailbox you have access to)

### Steps

1. **Open Apps Script**
   - Go to [script.google.com](https://script.google.com)
   - Click "New project"

2. **Paste the code**
   - Copy the contents of `Code.gs` from this repository
   - Paste into the Apps Script editor

3. **Configure your settings**
   - In the script, update the `CONFIG` object at the top with your values:
     ```javascript
     const CONFIG = {
       SHEET_ID: 'your-google-sheet-id-here',
       LABEL_NAME: 'support-requests',      // Gmail label to filter by
       DAYS_BACK: 1,                         // How many days back to fetch
       CATEGORIES: ['billing', 'technical', 'general', 'urgent']
     };
     ```

4. **Authorise the script**
   - Click Run → the first run will prompt you to authorise Gmail and Sheets access
   - Grant the required permissions

5. **Set up the trigger (for automatic daily runs)**
   - Click Triggers (clock icon) → Add Trigger
   - Function: `runPipeline`
   - Event: Time-driven → Day timer → Choose your preferred time (e.g. 7:00 AM)

6. **Test manually first**
   - Run `runPipeline` manually once to confirm it works before enabling the trigger

---

## Code Structure

```
Code.gs
├── CONFIG                    Configuration object (sheet ID, filters, categories)
├── runPipeline()             Main entry point — calls all functions in sequence
├── fetchEmails()             Retrieves emails matching filter criteria from Gmail
├── filterAndCategorise()     Applies category rules to each email thread
├── writeToSheet()            Writes structured data rows to Google Sheets
└── generateSummary()         Appends daily count summary to the sheet
```

---

## Notes

- All credentials and sheet IDs are stored in Script Properties — never hardcoded
- The script handles pagination automatically for high-volume mailboxes
- Category rules are configurable without touching the core logic
- Works with both personal Gmail and Google Workspace accounts

---

## Context

Built for an operational support environment handling **550–650 client accounts** in the automotive data privacy sector. The tool is used daily in a live production environment and has been running reliably since deployment.

---

*Built by [Arnab Bharati](https://linkedin.com/in/arnab-bharati-ai) · Part of a broader AI automation toolkit for support operations*
