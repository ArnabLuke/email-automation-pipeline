# Email Automation Pipeline — Google Apps Script

> A four-function email management platform built into Google Sheets.
> Extract, reply, reply with attachments, and forward emails — in bulk — directly from a spreadsheet.
> Reduced 3–4 hours of daily manual email processing to 1.5–2 hours — a **50%+ time saving**.

---

## Overview

This tool adds a custom **"Email Tool"** menu to Google Sheets with four fully independent
workflows, each opening its own sidebar panel. It connects Gmail and Google Drive to a
spreadsheet — turning the sheet into a live email operations dashboard.

Designed for high-volume support environments where the same email operations
(bulk replies, bulk forwards, filtered extractions) need to be performed repeatedly,
consistently, and without opening Gmail manually.

---

## The Problem

Managing a high-volume email-based support workflow manually required:

- Opening Gmail, searching with multiple filter criteria, and copying data into a spreadsheet by hand
- Replying individually to large batches of emails with the same response body
- Locating and attaching files from Drive before sending replies
- Forwarding emails one at a time to new destinations with correct formatting

This process consumed **3–4 hours every day** across extraction, triage, and action.

---

## The Solution

A Google Apps Script platform with four integrated workflows, accessible from a single
custom menu inside Google Sheets. No switching between apps. No manual copy-paste.
All email operations run directly from the sheet.

---

## The Four Workflows

### 1. Extract Emails
Pulls emails from Gmail into the sheet using up to **9 configurable filters**.
Handles pagination automatically — processes up to 500 threads per batch and loops
until all matching threads are retrieved.

### 2. Send Replies
Reads the extracted email data and sends a reply to each sender using a body
composed in the sidebar. Checks column H before sending — **will not re-send
to a row already marked as sent**.

### 3. Reply with Attachments
Same as Send Replies, but also fetches an attachment file from Google Drive
by filename (specified in column G) and includes it in the reply.
Handles "file not found" gracefully — marks the row accordingly instead of failing silently.

### 4. Forward Emails
Forwards extracted emails to new destination addresses (column I), with CC and BCC support
(columns J and K). Formats the forwarded message correctly — includes the original sender,
date, subject, and recipient in the forwarded header block.

---

## Impact

| Metric | Before | After | Improvement |
|---|---|---|---|
| Daily email processing time | 3–4 hours | 1.5–2 hours | **50%+ reduction** |
| Bulk reply / forward | Manual, one by one | Automated batch | Eliminated repetition |
| Duplicate send risk | Fully manual tracking | Column H status check | Prevented |
| Attachment handling | Manual Drive lookup | Automatic by filename | Eliminated |
| Filter setup | Retyped each time | Sidebar form, saved | Consistent |

---

## Sheet Structure

The tool uses a fixed 11-column layout. Column H drives the status tracking system
used by all sending functions.

| Col | Header | Populated By | Used By |
|---|---|---|---|
| A | Date | Extraction | — |
| B | Body | Extraction | Forward (original body) |
| C | Sender | Extraction | Reply, Reply+Attachment |
| D | Recipient | Extraction | Forward (original To) |
| E | Subject | Extraction | Reply, Reply+Attachment, Forward |
| F | Label | Extraction | — |
| G | Attachment File Name | **User fills in** | Reply with Attachments |
| H | Email sent status | Script writes | All send functions (duplicate guard) |
| I | Destination Email | **User fills in** | Forward |
| J | CC | **User fills in** | Reply+Attachment, Forward |
| K | BCC | **User fills in** | Reply+Attachment, Forward |

> Columns G, I, J, K are left blank by extraction. The user fills these in
> before running the relevant send/forward workflow.

### Column H status values

| Value | Meaning |
|---|---|
| `No` | Default — email extracted, no action taken yet |
| `Yes` | Reply or forward successfully sent |
| `Thread not found` | Gmail search returned no matching thread |
| `Attachment not found` | Drive file matching column G name not found |
| `Destination email not found` | Column I is empty — forward skipped |

---

## Extraction Filters

The extraction sidebar supports 9 filter parameters, all optional except the date range:

| Parameter | Gmail operator | Example |
|---|---|---|
| Start date | `after:` | `2024/01/01` |
| End date | `before:` | `2024/12/31` |
| Include label | `label:` | `support-requests` |
| Exclude label | `-label:` | `spam` |
| From sender | `from:` | `client@company.com` |
| Exclude sender | `-from:` | `noreply@service.com` |
| To recipient | `to:` | `team@company.com` |
| Exclude recipient | `-to:` | `archived@company.com` |
| Subject keyword | `subject:` | `urgent` |

The script combines all provided filters into a single Gmail search query
and paginates through results in batches of 500 until all matching threads are retrieved.

---

## How It Works

### Extraction flow

```
Sidebar form (date range, filters)
         │
         ▼
Build Gmail search query from parameters
         │
         ▼
GmailApp.search(query, start, 500)  ← batch 1
         │
         ├── Iterate threads → iterate messages
         │       └── Write to columns A–K
         │
         └── start += 500 → repeat until threads.length < 500
```

### Send / Forward flow (all three variants)

```
Sidebar form (email body)
         │
         ▼
Loop rows 2 → last row
         │
         ├── Column H = 'Yes'? → SKIP (already sent)
         │
         ├── Sending mode:
         │     Reply          → GmailApp.search by sender+subject → thread.reply()
         │     Reply+Attach   → same + DriveApp.getFilesByName() → attach blob
         │     Forward        → GmailApp.sendEmail() to column I, format Fwd header
         │
         └── Write result to column H ('Yes' / error message)
```

---

## Tech Stack

| Component | Technology |
|---|---|
| Runtime | Google Apps Script (JavaScript) |
| UI | `HtmlService` — four independent sidebar panels |
| Email access | `GmailApp` — search, read messages, reply, send |
| File access | `DriveApp` — file lookup by name, blob extraction |
| Sheet access | `SpreadsheetApp` — read, write, clear, set headers |
| Trigger | User-initiated via custom menu |

---

## File Structure

```
repo/
├── Code.gs                          Core script — all backend functions
├── Sidebar.html                     Extract Emails sidebar UI
├── ReplySidebar.html                Send Reply sidebar UI
├── ReplyWithAttachmentsSidebar.html Reply with Attachments sidebar UI
├── ForwardSidebar.html              Forward Emails sidebar UI
└── README.md                        This file
```

### Code.gs function map

```
onOpen()                       Creates "Email Tool" menu with four items

showSidebar()                  Opens Email Extractor sidebar
showReplySidebar()             Opens Send Replies sidebar
showReplyWithAttachmentsSidebar()  Opens Reply+Attachments sidebar
showForwardSidebar()           Opens Forward Emails sidebar

extractEmailsToSheet()         Clears sheet, builds Gmail query, paginates results,
                               writes all matching emails to columns A–K

sendReply()                    Finds Gmail thread by sender+subject, replies,
                               marks column H as sent (duplicate guard)

sendAllReplies()               Loops all rows, calls sendReply() for each

sendReplyWithAttachments()     Like sendReply() + fetches Drive file by name,
                               attaches blob, handles CC/BCC from columns J/K

sendAllRepliesWithAttachments() Loops all rows, calls sendReplyWithAttachments()

forwardEmail()                 Sends email to column I with Fwd: header block,
                               CC from column J, BCC from column K

forwardAllEmails()             Loops all rows, calls forwardEmail() for each
```

---

## Setup

### Prerequisites

- Google account with access to Gmail, Google Drive, and Google Sheets
- The files in Google Drive to attach (if using Reply with Attachments)

### Steps

**1. Open Apps Script**
- Open Google Sheets → **Extensions → Apps Script**
- Replace the default `Code.gs` content with the code from `Code.gs` in this repo
- Create four new HTML files (click **+** next to Files for each):
  - `Sidebar`
  - `ReplySidebar`
  - `ReplyWithAttachmentsSidebar`
  - `ForwardSidebar`
- Paste the corresponding HTML from this repo into each file
- Save all files

**2. Reload the sheet**
- Close the Apps Script editor
- Reload your Google Sheet
- The **"Email Tool"** menu will appear in the menu bar

**3. Authorise on first run**
- Click **Email Tool → Extract Emails**
- Google will prompt you to authorise
- Grant access to Gmail (read/send), Drive (read files), and Sheets

**4. Extract first**
- Always run extraction before any send/forward workflow
- Set your date range and filters in the sidebar
- Click Extract — the sheet will populate

**5. Review and fill in action columns**
- For Reply with Attachments: add Drive filenames to column G
- For Forward: add destination emails to column I, CC/BCC to columns J/K

**6. Run send/forward workflow**
- Open the relevant sidebar from the menu
- Enter the email body
- Click Send/Forward All — the script processes every row, skipping already-sent rows

---

## Notes

- **Duplicate send prevention**: All three sending functions check column H before acting.
  A row marked `Yes` is never processed again — safe to re-run without duplicate sends.
- **Pagination**: Extraction handles any mailbox size by looping in 500-thread batches
  until the full result set is retrieved.
- **Drive attachment lookup**: Files are matched by exact filename. If multiple files share
  the same name, the first result is used.
- **Forward formatting**: Forwarded messages include a properly formatted header block
  (From, Date, Subject, To) matching standard email forwarding conventions.

---

## Context

Built for a support operations environment handling daily email workflows across
**550–650 automotive client accounts**. Used in production for extraction, triage,
and bulk response operations.

---

*Built by [Arnab Bharati](https://linkedin.com/in/arnab-bharati-ai) · Part of a broader
AI automation toolkit for support operations*
