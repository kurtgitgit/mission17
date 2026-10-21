# Officials directory and public verification revisions

## Intent and agreed scope

The admin should not have to understand numeric sort weights. Editing an official near the bottom must visibly open the edit form. The official website and English/Tagalog chatbot must use the current active directory, including available published phone numbers. Public verification needs a visible return path to the official website.

Five user-requested revisions:
1. Replace the confusing Sort Order field with an understandable ordering interaction.
2. Scroll to and focus the official edit form when Edit is selected.
3. Remove the public verification navigation dead end.
4. Show newly added active officials and their corresponding phone numbers on the official website, synchronized with admin changes.
5. Answer officials questions with current directory details in English and Tagalog; politely acknowledge unavailable information without guessing.

## Proposed implementation choices for approval

- Group the directory by position: Punong Barangay, Barangay Kagawad, SK Chairperson, Barangay Secretary, Barangay Treasurer, Chief Tanod, BHW President, then other positions. Captain remains first. Replace numeric input with accessible Move up / Move down actions within each position group, with disabled boundary controls and visible save feedback. Retain existing order within each group initially. New/restored records append within their group; changing position appends within the destination group. This is display order, not seniority or electoral ranking.
- Keep the existing inline Add/Edit form. After React renders it, scroll it into view and focus its heading without a second scroll. Respect reduced-motion preferences. Do not create another route or modal.
- Add a persistent `Back to official website` link on `/public-verify`, targeting `https://mission17-app.vercel.app/`. It must work in a fresh tab without browser history; do not use a caller-supplied redirect URL. Keep verification anonymous, legacy references supported, and the admin login free of the previously removed verification link.
- Use the existing active-officials API for the website and chatbot rather than another hardcoded roster, static training data, or a new AI dependency. Fetch on website mount and tab refocus, provide a refresh/retry action, and cancel stale requests. Updates appear on the next fetch; this does not promise realtime push synchronization.
- Display only saved, published directory fields: name, position, committee, term, term number, and available contact/email. Keep phone numbers as text and create validated `tel:` links. If a number is missing, say `Contact number not available`; never borrow another official's number. Do not guess missing newly added officials or contacts from screenshots.
- Chat queries may request the full active roster, a position, a committee, or a named official and their published details. English and Tagalog have equivalent behavior. An unclear question such as `Who is the barangay?` / `Sino ang barangay?` asks which role/person is meant. Missing matches, missing fields, and lookup outages receive distinct polite responses. Directory facts must never come from generated AI prose if lookup fails.

## Boundaries

No database roster replacement, deletion, re-training, native app redesign, production data edits, dependency upgrades, deployment, or OTA publication is authorized by this planning request. Preserve existing active/archive/restore behavior and admin authorization. Do not expose archive notes, account information, ID documents, or unpublished private contact details. Preserve emergency/private-record response priority and unrelated chatbot FAQs.

## Source findings

- `mission17-admin/src/pages/Officials.jsx`: numeric `order` form field; `startEdit` only sets state, with no scroll/focus.
- `mission17-backend/routes/officials.js`: active public directory, admin-only archived/all reads and writes; order currently sorted numerically, then position/creation date.
- `mission17-backend/models/Official.js`: optional `contact`, `email`, `committee`, `term`, `termNumber`; numeric `order` range 1–99; archive metadata shares this model.
- `mission17-website/src/App.jsx`: hardcoded `OFFICIALS`, captain identity, captain phone, and term text; therefore admin additions cannot appear automatically.
- `mission17-backend/routes/chatbot.js`: controlled officials reply runs before live lookup and redirects to the mobile directory. Live query also selects only name/position and limits to three.
- `mission17-backend/routes/chatbotLiveData.js`: generic roster response caps at three and does not select a requested official/role.
- `mission17-admin/src/pages/PublicVerify.jsx`: standalone portal without a return link; it already has unrelated uncommitted error-handling work that must be preserved.

## Completion evidence

Automated backend tests must prove ordering safety/authorization, active-only public fields, actual chatbot endpoint routing and bilingual factual answers/fallbacks. Browser checks must demonstrate bottom-of-list Edit scrolling/focus, accessible ordering and persistence, live website data/phone links, loading/empty/error/retry states, and the verification return path at desktop and narrow mobile widths. Production and handset behavior remain unverified until separately authorized and checked.
