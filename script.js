// Eventory keeps its data in this browser. The original eventPortalData key is
// retained so events created by the first version remain available.
const DATA_KEY = "eventPortalData";
const THEME_KEY = "eventPortalTheme";
const $ = (id) => document.getElementById(id);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d][\d\s().-]{6,19}$/;
let events = loadEvents();
let activeDetailsId = null;

function safeArray(value) { return Array.isArray(value) ? value : []; }
function loadEvents() {
  try {
    const saved = JSON.parse(localStorage.getItem(DATA_KEY));
    if (saved === null) return sampleEvents();
    if (!Array.isArray(saved)) return [];
    return saved.filter((event) => event && typeof event === "object").map((event, index) => ({
      id: event.id ?? `legacy-${index}-${Date.now()}`,
      name: String(event.name || "Untitled event"), date: String(event.date || ""), time: String(event.time || "12:00"),
      location: String(event.location || "Venue not specified"), description: String(event.description || ""),
      category: String(event.category || "Other"), organizer: String(event.organizer || ""),
      capacity: event.capacity === "" || event.capacity == null ? null : Number(event.capacity),
      participants: safeArray(event.participants).filter((p) => p && typeof p === "object").map((p, pIndex) => ({
        id: p.id || `legacy-reg-${index}-${pIndex}`, name: String(p.name || "Participant"), email: String(p.email || ""),
        phone: String(p.phone || ""), registeredAt: p.registeredAt || ""
      }))
    }));
  } catch { return []; }
}
function persist() {
  try { localStorage.setItem(DATA_KEY, JSON.stringify(events)); }
  catch { notify("Could not save changes. Browser storage may be full or disabled.", "error"); }
}
function node(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}
function notify(message, type = "success") {
  const box = $("message"); box.textContent = message; box.className = `message ${type}`;
  clearTimeout(notify.timer); notify.timer = setTimeout(() => box.classList.add("hidden"), 4200);
}
function eventDateTime(event) { return new Date(`${event.date}T${event.time || "23:59"}:00`); }
function isPast(event) { return eventDateTime(event) < new Date(); }
function formatDate(date) {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? "Date not set" : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(time) {
  if (!time) return "Time not set";
  const [hour, minute] = time.split(":").map(Number);
  return `${(hour % 12) || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}
function formatRegistered(date) {
  if (!date) return "—";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function allRegistrations() {
  return events.flatMap((event) => event.participants.map((participant) => ({ ...participant, eventId: event.id, eventName: event.name })));
}
function render() {
  const registrations = allRegistrations();
  const past = events.filter(isPast).length;
  $("totalEvents").textContent = events.length;
  $("totalRegistrations").textContent = registrations.length;
  $("pastEvents").textContent = past;
  $("upcomingEvents").textContent = events.length - past;
  renderFilters(); renderEvents(); renderUpcoming(); renderCategories(); renderRegistrations();
}
function renderFilters() {
  const categories = [...new Set(events.map((event) => event.category || "Other"))].sort();
  const category = $("categoryFilter"); const oldCategory = category.value;
  category.replaceChildren(new Option("All categories", "all"));
  categories.forEach((value) => category.add(new Option(value, value)));
  if (categories.includes(oldCategory)) category.value = oldCategory;
  const registrationEvent = $("registrationEventFilter"); const oldEvent = registrationEvent.value;
  registrationEvent.replaceChildren(new Option("All events", "all"));
  events.forEach((event) => registrationEvent.add(new Option(event.name, String(event.id))));
  if (events.some((event) => String(event.id) === oldEvent)) registrationEvent.value = oldEvent;
  const regSelect = $("regEvent"); const selectedRegEvent = regSelect.value;
  regSelect.replaceChildren();
  if (!events.length) regSelect.add(new Option("Create an event first", ""));
  else events.forEach((event) => regSelect.add(new Option(`${event.name} · ${formatDate(event.date)}`, String(event.id))));
  if (events.some((event) => String(event.id) === selectedRegEvent)) regSelect.value = selectedRegEvent;
}
function filteredEvents() {
  const query = $("searchInput").value.trim().toLowerCase();
  const category = $("categoryFilter").value; const status = $("statusFilter").value;
  const sort = $("sortSelect").value;
  const list = events.filter((event) => {
    const searchable = [event.name, event.location, event.organizer, event.category].join(" ").toLowerCase();
    return searchable.includes(query) && (category === "all" || event.category === category) && (status === "all" || (status === "past") === isPast(event));
  });
  return list.sort((a, b) => sort === "alpha" ? a.name.localeCompare(b.name) : sort === "newest" ? String(b.date).localeCompare(String(a.date)) : eventDateTime(a) - eventDateTime(b));
}
function renderEvents() {
  const list = filteredEvents(); const box = $("eventList"); box.replaceChildren(); $("visibleCount").textContent = list.length;
  if (!list.length) {
    const empty = node("div", "empty-state"); empty.append(node("span", "empty-icon", "✦"));
    empty.append(node("h3", "", events.length ? "No events match these filters" : "Your event calendar is clear"));
    empty.append(node("p", "", events.length ? "Try changing your search or filters." : "Create an event to start building your calendar."));
    if (!events.length) { const button = node("a", "button primary", "Create your first event"); button.href = "#events"; empty.append(button); }
    box.append(empty); return;
  }
  list.forEach((event) => box.append(createEventCard(event)));
}
function createEventCard(event) {
  const card = node("article", "event-card");
  const top = node("div", "event-card-top");
  const dateBadge = node("div", "date-badge");
  const date = new Date(`${event.date}T00:00:00`);
  dateBadge.append(node("span", "", Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en", { month: "short" }).toUpperCase()));
  dateBadge.append(node("strong", "", Number.isNaN(date.getTime()) ? "—" : date.getDate()));
  top.append(dateBadge);
  const title = node("div", "card-title"); title.append(node("span", "category-tag", event.category)); title.append(node("h3", "", event.name));
  top.append(title); top.append(node("span", `status-tag ${isPast(event) ? "past" : ""}`, isPast(event) ? "Past" : "Upcoming")); card.append(top);
  const details = node("div", "event-meta"); details.append(node("p", "", `◷  ${formatTime(event.time)}`)); details.append(node("p", "", `⌖  ${event.location}`));
  if (event.organizer) details.append(node("p", "", `♙  ${event.organizer}`)); card.append(details);
  if (event.description) card.append(node("p", "event-description", event.description));
  const seats = event.capacity ? `${Math.max(0, event.capacity - event.participants.length)} seats available` : "No capacity limit";
  const footer = node("div", "event-card-footer"); footer.append(node("span", "registration-count", `☷  ${event.participants.length} registered · ${seats}`));
  const actions = node("div", "card-actions");
  [["View", "view"], ["Edit", "edit"], ["Delete", "delete"]].forEach(([label, action]) => { const button = node("button", `small-action ${action === "delete" ? "delete-action" : ""}`, label); button.type = "button"; button.dataset.action = action; button.dataset.id = event.id; actions.append(button); });
  footer.append(actions); card.append(footer);
  if (event.capacity && event.participants.length >= event.capacity) card.append(node("p", "capacity-warning", "Registration capacity reached"));
  return card;
}
function renderUpcoming() {
  const box = $("upcomingList"); box.replaceChildren();
  const upcoming = events.filter((event) => !isPast(event)).sort((a, b) => eventDateTime(a) - eventDateTime(b)).slice(0, 4);
  if (!upcoming.length) { box.append(node("p", "muted", "No upcoming events yet. Create one to see it here.")); return; }
  upcoming.forEach((event) => {
    const row = node("div", "upcoming-item");
    const date = new Date(`${event.date}T00:00:00`); const tile = node("div", "upcoming-date");
    tile.append(node("span", "", date.toLocaleDateString("en", { month: "short" }).toUpperCase())); tile.append(node("strong", "", date.getDate())); row.append(tile);
    const info = node("div", "upcoming-info"); info.append(node("strong", "", event.name)); info.append(node("span", "", `${formatTime(event.time)} · ${event.location}`)); row.append(info);
    row.append(node("span", "upcoming-attendees", `${event.participants.length} joined`)); box.append(row);
  });
}
function renderCategories() {
  const box = $("categorySummary"); box.replaceChildren();
  const counts = events.reduce((summary, event) => { const key = event.category || "Other"; summary[key] = (summary[key] || 0) + 1; return summary; }, {});
  if (!Object.keys(counts).length) { box.append(node("p", "muted", "Categories appear here once you create events.")); return; }
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
    const row = node("div", "category-row"); row.append(node("span", "category-dot"), node("span", "", category), node("strong", "", count)); box.append(row);
  });
}
function renderRegistrations() {
  const search = $("registrationSearch").value.trim().toLowerCase(); const eventFilter = $("registrationEventFilter").value;
  const rows = $("registrationRows"); rows.replaceChildren();
  const results = allRegistrations().filter((registration) => `${registration.name} ${registration.email}`.toLowerCase().includes(search) && (eventFilter === "all" || String(registration.eventId) === eventFilter));
  $("registrationEmpty").classList.toggle("hidden", results.length > 0);
  results.forEach((registration) => {
    const tr = document.createElement("tr");
    [registration.name, registration.email, registration.phone || "—", registration.eventName, formatRegistered(registration.registeredAt)].forEach((value) => tr.append(node("td", "", value)));
    const status = node("td"); status.append(node("span", "table-status", "Registered")); tr.append(status);
    const action = node("td"); const cancel = node("button", "table-action", "Cancel"); cancel.type = "button"; cancel.dataset.action = "cancel-registration"; cancel.dataset.eventId = registration.eventId; cancel.dataset.registrationId = registration.id; action.append(cancel); tr.append(action);
    rows.append(tr);
  });
}
function resetEventForm() {
  $("eventForm").reset(); $("eventId").value = ""; $("formTitle").textContent = "Create an event"; $("saveBtn").textContent = "Create event"; $("cancelBtn").classList.add("hidden");
}
function editEvent(event) {
  $("eventId").value = event.id; $("eventName").value = event.name; $("eventDate").value = event.date; $("eventTime").value = event.time;
  $("eventLocation").value = event.location; $("eventCategory").value = event.category; $("eventCapacity").value = event.capacity || "";
  $("eventOrganizer").value = event.organizer; $("eventDescription").value = event.description;
  $("formTitle").textContent = "Edit event"; $("saveBtn").textContent = "Save changes"; $("cancelBtn").classList.remove("hidden"); $("eventName").focus();
}
function showDetails(event) {
  activeDetailsId = event.id; const box = $("dialogContent"); box.replaceChildren();
  box.append(node("p", "eyebrow", `${event.category} · ${isPast(event) ? "PAST EVENT" : "UPCOMING EVENT"}`)); box.append(node("h2", "dialog-title", event.name));
  [["Date", formatDate(event.date)], ["Time", formatTime(event.time)], ["Venue", event.location], ["Organizer", event.organizer || "Not specified"], ["Participants", `${event.participants.length}${event.capacity ? ` / ${event.capacity}` : ""}`], ["Description", event.description || "No description provided."]].forEach(([label, value]) => { const row = node("div", "detail-row"); row.append(node("span", "", label), node("strong", "", value)); box.append(row); });
  const participantsTitle = node("h3", "dialog-subtitle", "Registered participants"); box.append(participantsTitle);
  if (!event.participants.length) box.append(node("p", "muted", "No participants have registered yet."));
  event.participants.forEach((participant) => box.append(node("p", "participant-line", `${participant.name} · ${participant.email}${participant.phone ? ` · ${participant.phone}` : ""}`)));
  $("detailsDialog").showModal();
}
$("eventForm").addEventListener("submit", (event) => {
  event.preventDefault(); const name = $("eventName").value.trim(); const date = $("eventDate").value; const time = $("eventTime").value;
  const location = $("eventLocation").value.trim(); const organizer = $("eventOrganizer").value.trim(); const description = $("eventDescription").value.trim();
  const capacityText = $("eventCapacity").value.trim(); const capacity = capacityText ? Number(capacityText) : null;
  if (!name || !date || !time || !location) return notify("Enter an event name, date, time, and venue.", "error");
  const parsedDate = new Date(`${date}T${time}:00`);
  if (Number.isNaN(parsedDate.getTime())) return notify("Enter a valid event date and time.", "error");
  if (capacityText && (!Number.isInteger(capacity) || capacity < 1)) return notify("Capacity must be a whole number greater than zero.", "error");
  const id = $("eventId").value; const existing = events.find((item) => String(item.id) === id);
  const data = { name, date, time, location, category: $("eventCategory").value, organizer, description, capacity };
  if (existing) { Object.assign(existing, data); notify(`“${name}” updated.`); }
  else { events.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), ...data, participants: [] }); notify(`“${name}” added.`); }
  persist(); resetEventForm(); render();
});
$("cancelBtn").addEventListener("click", resetEventForm);
$("regForm").addEventListener("submit", (event) => {
  event.preventDefault(); const selectedId = $("regEvent").value;
  const target = events.find((item) => String(item.id) === selectedId);
  const name = $("regName").value.trim(); const email = $("regEmail").value.trim(); const phone = $("regPhone").value.trim();
  if (!target) return notify("Choose an available event first.", "error");
  if (!name || !email || !phone) return notify("Enter the participant’s name, email, and phone number.", "error");
  if (!emailPattern.test(email)) return notify("Enter a valid email address.", "error");
  if (!phonePattern.test(phone)) return notify("Enter a valid phone number.", "error");
  if (target.participants.some((participant) => participant.email.toLowerCase() === email.toLowerCase())) return notify("This email is already registered for the selected event.", "error");
  if (target.capacity && target.participants.length >= target.capacity) return notify("This event has reached its registration capacity.", "error");
  target.participants.push({ id: crypto.randomUUID ? crypto.randomUUID() : `reg-${Date.now()}`, name, email, phone, registeredAt: new Date().toISOString() });
  persist(); $("regForm").reset(); render(); notify(`${name} registered for “${target.name}”.`);
});
$("eventList").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]"); if (!button) return;
  const item = events.find((candidate) => String(candidate.id) === button.dataset.id); if (!item) return;
  if (button.dataset.action === "edit") editEvent(item);
  if (button.dataset.action === "view") showDetails(item);
  if (button.dataset.action === "delete" && confirm(`Delete “${item.name}” and its ${item.participants.length} registration(s)? Associated registrations will be removed.`)) {
    events = events.filter((candidate) => candidate.id !== item.id); if (String($("eventId").value) === String(item.id)) resetEventForm();
    persist(); render(); notify("Event and its registrations deleted.");
  }
});
["searchInput", "categoryFilter", "statusFilter", "sortSelect"].forEach((id) => $(id).addEventListener(id === "searchInput" ? "input" : "change", renderEvents));
["registrationSearch", "registrationEventFilter"].forEach((id) => $(id).addEventListener(id === "registrationSearch" ? "input" : "change", renderRegistrations));
$("registrationRows").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action='cancel-registration']"); if (!button) return;
  const item = events.find((candidate) => String(candidate.id) === button.dataset.eventId); if (!item) return;
  const participant = item.participants.find((candidate) => String(candidate.id) === button.dataset.registrationId); if (!participant) return;
  if (!confirm(`Cancel ${participant.name}’s registration for “${item.name}”?`)) return;
  item.participants = item.participants.filter((candidate) => candidate.id !== participant.id); persist(); render(); notify("Registration cancelled.");
});
$("exportBtn").addEventListener("click", () => {
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = [["Participant name", "Email", "Phone", "Event name", "Registration date", "Status"], ...allRegistrations().map((r) => [r.name, r.email, r.phone, r.eventName, formatRegistered(r.registeredAt), "Registered"])];
  const blob = new Blob(["\uFEFF" + lines.map((line) => line.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "event-registrations.csv"; link.click(); URL.revokeObjectURL(url); notify("Registration CSV exported.");
});
$("closeDialog").addEventListener("click", () => $("detailsDialog").close());
$("detailsDialog").addEventListener("click", (event) => { if (event.target === $("detailsDialog")) $("detailsDialog").close(); });
$("printBtn").addEventListener("click", () => window.print());
$("themeToggle").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next; localStorage.setItem(THEME_KEY, next); $("themeToggle").textContent = next === "dark" ? "☀" : "◐";
});
$("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset all saved events and registrations to the sample data? This cannot be undone.")) return;
  events = sampleEvents(); persist(); resetEventForm(); render(); notify("Demo data has been reset.");
});
function sampleEvents() {
  const future = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
  return [
    { id: "demo-1", name: "Design Futures Forum", date: future(8), time: "10:00", location: "Innovation Hall", description: "A day of talks and practical sessions exploring the future of product design.", category: "Conference", organizer: "Creative Programs", capacity: 120, participants: [] },
    { id: "demo-2", name: "Build Your First Web App", date: future(17), time: "14:30", location: "Studio 04", description: "A friendly, hands-on introduction to building and sharing a small web app.", category: "Workshop", organizer: "Learning Team", capacity: 32, participants: [] },
    { id: "demo-3", name: "Community Connect Evening", date: future(26), time: "18:00", location: "Riverside Commons", description: "Meet fellow makers and share what you are working on.", category: "Networking", organizer: "Community Team", capacity: null, participants: [] }
  ];
}
const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme === "dark" || savedTheme === "light") document.documentElement.dataset.theme = savedTheme;
$("themeToggle").textContent = document.documentElement.dataset.theme === "dark" ? "☀" : "◐";
$("todayLabel").textContent = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
$("year").textContent = new Date().getFullYear();
document.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", () => {
  document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active")); link.classList.add("active");
}));
render();
