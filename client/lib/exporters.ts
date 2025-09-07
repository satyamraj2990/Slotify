export type ExportSlot = {
  day: string; // Mon..Sat
  period: number; // 1..8
  course?: string;
  room?: string;
  faculty?: string;
  elective?: boolean;
  color?: string;
};

const DAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5 };
const INDEX_DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function sortSlots(slots: ExportSlot[]) {
  return [...slots].sort((a, b) => {
    const da = DAY_INDEX[a.day] ?? 0;
    const db = DAY_INDEX[b.day] ?? 0;
    if (da !== db) return da - db;
    return a.period - b.period;
  });
}

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function exportTimetableCSV(slots: ExportSlot[], filename = "timetable.csv") {
  const header = ["Day", "Period", "Course", "Room", "Faculty", "Elective"];
  const rows = sortSlots(slots).map((s) => [s.day, s.period, s.course ?? "", s.room ?? "", s.faculty ?? "", s.elective ? "Yes" : "No"]);
  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}

function pad(n: number) { return n.toString().padStart(2, "0"); }
function fmtICS(dt: Date) {
  return `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}
function weekStartMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // Sun=0 ... Sat=6
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0,0,0,0);
  return date;
}
function periodTime(period: number) {
  // Default: P1=09:00, each 60 min
  const start = new Date();
  start.setHours(9 + (period - 1), 0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 1);
  return { start, end };
}

export function exportTimetableICS(slots: ExportSlot[], filename = "timetable.ics") {
  const base = weekStartMonday();
  const events = sortSlots(slots).map((s, i) => {
    const offset = DAY_INDEX[s.day] ?? 0;
    const date = new Date(base);
    date.setDate(base.getDate() + offset);
    const { start, end } = periodTime(s.period);
    // apply time (hours/min) from period into chosen date
    const dtStart = new Date(date); dtStart.setHours(start.getHours(), start.getMinutes(), 0, 0);
    const dtEnd = new Date(date); dtEnd.setHours(end.getHours(), end.getMinutes(), 0, 0);
    const uid = `slot-${i}-${Date.now()}@nep-timetable`;
    const summary = `${s.course ?? "Course"}${s.room ? ` @ ${s.room}` : ""}`;
    const description = s.faculty ? `Faculty: ${s.faculty}` : "";
    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${fmtICS(new Date())}`,
      `DTSTART:${fmtICS(dtStart)}`,
      `DTEND:${fmtICS(dtEnd)}`,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : undefined,
      "END:VEVENT",
    ].filter(Boolean).join("\n");
  });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Slotiफाई//EN",
    ...events,
    "END:VCALENDAR",
  ].join("\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}

function htmlTable(slots: ExportSlot[], periods = 8) {
  const map = new Map<string, ExportSlot>();
  slots.forEach((s) => map.set(`${s.day}-${s.period}`, s));
  const head = Array.from({ length: periods }, (_, i) => `<th>P${i+1}</th>`).join("");
  const body = INDEX_DAY.map((d) => {
    const cells = Array.from({ length: periods }, (_, p) => {
      const s = map.get(`${d}-${p+1}`);
      const txt = s ? `${s.course ?? ""}${s.room ? `\n${s.room}` : ""}${s.faculty ? `\n${s.faculty}` : ""}` : "";
      return `<td>${txt.replace(/</g, "&lt;")}</td>`;
    }).join("");
    return `<tr><th>${d}</th>${cells}</tr>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Timetable</title>
  <style>
  body{font-family:ui-sans-serif,system-ui;}
  h1{font-size:18px;margin:0 0 12px 0}
  table{border-collapse:collapse;width:100%;}
  th,td{border:1px solid #ddd;padding:8px;vertical-align:top;white-space:pre-line}
  th{background:#f6f7f9}
  @media print{@page{size:A4 landscape;margin:12mm}}
  </style>
  </head><body>
  <h1>Slotiफाई</h1>
  <table><thead><tr><th>Day</th>${head}</tr></thead><tbody>${body}</tbody></table>
  </body></html>`;
}

export function exportTimetablePDF(slots: ExportSlot[], periods = 8) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(htmlTable(slots, periods));
  w.document.close();
  // Give the browser a tick to render before printing
  setTimeout(() => {
    w.focus();
    w.print();
  }, 250);
}
