# Event Management Portal

- **Project name:** Event Management Portal (Eventory)
- **Intern ID:** CITS9948
- **Full name:** MEKALA ANUDEEP
- **Company:** CodTech IT Solutions
- **Internship duration:** 4 Weeks

## Project overview

Eventory is a responsive, browser-based event administration dashboard. Organizers can create and maintain events, record participant registrations, review attendance details, and export the registration list. It uses plain HTML, CSS, and JavaScript with no server or build step.

## Features

- Dashboard summary for total, upcoming, and past events and registrations
- Event creation and editing with date, time, venue, category, organizer, description, and optional capacity
- Search by name, venue, organizer, or category; category/status filters and date/name sorting
- Event details dialog, participant list, capacity availability, and confirmed event deletion
- Participant registration with name, validated email and phone, duplicate prevention, and capacity checks
- Registration management table with search, event filter, cancellation confirmation, and CSV export
- Upcoming events and category summaries
- Light and dark themes, saved in the browser
- Sample events on first launch and a confirmed reset option in Settings
- Responsive layout and print-friendly event details

## Technologies

HTML5, CSS3, vanilla JavaScript (ES6), browser `localStorage`. Google Fonts are loaded from a CDN when network access is available; system fonts remain the fallback.

## Project structure

```text
Event_Management_Portal/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Run the application

No installation is needed. Open `index.html` in a modern browser, or start a local server from this folder:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Testing the features

1. Create an event with its required name, date, time, and venue. Optional fields include category, organizer, description, and capacity.
2. Edit the event and verify the event card and dashboard counts update.
3. Delete an event and confirm; its registrations are removed with it.
4. Try event search, category/status filters, and each sort option.
5. Register a participant with a valid name, email, and phone. Try the same email twice for one event and try registering when capacity is full.
6. Search/filter the registration table, cancel a registration, and export the list to CSV.
7. Change the theme and reload the page to confirm the choice persists.
8. Reload the page to confirm event and registration data persists.
9. Use Settings to reset to sample data after confirming.

## Data storage

Events and their participant registrations are stored in this browser's `localStorage` under the `eventPortalData` key. The application retains this original key to preserve data created by the first version. The selected theme is stored separately under `eventPortalTheme`. Data is local to the browser profile and is not synchronized between devices.

## Known limitations

- There is no backend database, account system, or cross-device synchronization.
- Clearing browser storage removes saved data. Do not use this app as the only copy of important records.
- Registrations and notifications are managed locally; no emails or external messages are sent.
- The Google Fonts enhancement needs an internet connection; the rest of the app works without it.

