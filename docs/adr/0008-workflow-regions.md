# 0008 — Workflow regions and explicit output controls

- Status: Accepted
- Date: 2026-10-09

## Context

A 2026-10-09 workflow review found related commands spread across the header,
toolbar, navigation bar, Pages panel, footer and several dialogs. Three of them
could produce a file the user did not intend:

- Dropping a PDF on an open document appended its pages, while header Open and
  the tab-strip plus button opened a new tab.
- Choosing more than one page per sheet in a collapsed Export section changed
  Download PDF into an N-up derivative without changing the button label.
- Page-scoped actions each chose pages differently, and Export relied on
  thumbnail checkboxes that were hidden when the Pages panel was closed.

The review also found these wayfinding problems:

- Export mixed settings with buttons that acted immediately (project, PNG,
  direct save) and ignored most of those settings.
- Page operations were split between the Pages panel, a bottom Blank page
  button and a toolbar Tools menu that also held batch processing of other files.
- Text highlighting was a navigation-bar button separate from the Highlight tool.
- Bookmarks reused the search-result dropdown, which showed bookmark editing on
  text-search results.
- Library and draft recovery lived in the footer away from Open; zoom sat in
  the footer away from page navigation; Settings held one storage option; the
  document name was editable only in a dialog.
- One Properties button meant Bring to front for shapes and tab order for
  fields, and Comments panel Add comment placed notes at the page centre even
  when that was scrolled out of view.

## Decision

Give each editor region one question to answer:

| Region         | Question                                                |
| -------------- | ------------------------------------------------------- |
| Header         | Which file is open, how do I get files in and out?      |
| Toolbar        | Which tool do I place on the page?                      |
| Navigation bar | Which page am I looking at, and at what zoom?           |
| Left panel     | Pages and bookmarks: what is in the document, in order? |
| Right panel    | What are the properties or comments of my selection?    |
| Footer         | Is my work saved, and is the app current and offline?   |

Dropped files open as documents, exactly like header Open. Appending is an
explicit target: drop onto the Pages thumbnail list or use Insert. A dropped
`.pdfree` project always opens as its own document because a project replaces
page content wholesale.

Export chooses an output format first. Each format shows only the options that
change its file, and the primary button names the file it produces. Extract and
Split are Export formats rather than Pages panel downloads.

Page-scoped commands use one scope control offering all, current, selected and
range choices with the effective page count. The Pages panel scope edits the
shared thumbnail selection; dialogs hold their own scope initialised from it.
Split keeps its own range syntax because its ranges define output files rather
than a page subset.

Every command that changes the page set lives in the Pages panel (Insert and
More menus). File sources other than the picker — Library and Process multiple
PDFs — sit in a menu beside Open and on the start screen. Storage preferences
live in Library. The footer reports status only.

## Alternatives

- **Keep drop-to-append and add a confirmation.** Rejected: it makes the common
  case (open another file) slower and keeps drop inconsistent with Open.
- **Ask on every drop whether to open or append.** Rejected: a modal question on
  every drop is friction when two clear targets express the intent directly.
- **Keep the all-in-one Export form and relabel buttons.** Rejected: the form
  still mixes immediate actions with settings that apply to only some outputs.

## Consequences

- Users who relied on dropping onto the page to merge use the Pages list or
  Insert instead.
- Export takes one extra choice for non-PDF outputs; the PDF default keeps the
  common path unchanged.
- New page-scoped commands reuse the scope control rather than adding their own
  page pickers.
- Library takes two clicks from the header instead of one from the footer; the
  start screen links to it directly.
- Phones hide the header document name, so the Document dialog also offers
  rename there; both edit the same document name.
