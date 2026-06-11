const crypto = require("crypto");

const NOTION_VERSION = "2022-06-28";
const DEFAULT_TASKS_DATABASE_ID = "1ae7a290945144f0a01a2cc376820007";
const DEFAULT_TIME_OFFSET = "+09:00";
const GCAL_MARKER_PREFIX = "gcal-sync-id:";

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

async function main() {
  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_TASKS_DATABASE_ID || DEFAULT_TASKS_DATABASE_ID;
  const icalUrls = splitSourceUrls(process.env.GOOGLE_CALENDAR_ICAL_URL || "");
  const defaultOffset = process.env.GCAL_DEFAULT_TIME_OFFSET || DEFAULT_TIME_OFFSET;
  const lookbackDays = Number(process.env.GCAL_SYNC_LOOKBACK_DAYS || 30);
  const lookaheadDays = Number(process.env.GCAL_SYNC_LOOKAHEAD_DAYS || 180);

  if (!notionToken) throw new Error("Missing NOTION_TOKEN");

  if (icalUrls.length === 0) {
    console.log("Missing GOOGLE_CALENDAR_ICAL_URL. Skipping Google Calendar sync.");
    return;
  }

  const windowStart = addDays(new Date(), -lookbackDays);
  const windowEnd = addDays(new Date(), lookaheadDays);
  const notion = createNotionClient(notionToken);
  const existingPages = await listNotionTaskPages(notion, databaseId);
  const pagesByMarker = mapPagesByMarker(existingPages);

  const events = [];
  for (const url of icalUrls) {
    const calendarHash = hashShort(url);
    const icsText = await fetchText(url);
    const parsedEvents = parseIcsEvents(icsText, calendarHash, defaultOffset);
    events.push(...expandEvents(parsedEvents, windowStart, windowEnd, defaultOffset));
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const event of events) {
    const page = pagesByMarker.get(event.marker);
    if (!page) {
      await createTaskPage(notion, databaseId, event);
      created++;
      continue;
    }

    if (pageMatchesEvent(page, event)) {
      unchanged++;
      continue;
    }

    await updateTaskPage(notion, page.id, event);
    updated++;
  }

  console.log(`Google Calendar events found: ${events.length}`);
  console.log(`Created Notion tasks: ${created}`);
  console.log(`Updated Notion tasks: ${updated}`);
  console.log(`Unchanged Notion tasks: ${unchanged}`);
}

function splitSourceUrls(value) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createNotionClient(token) {
  return async function notion(path, method = "GET", body) {
    const response = await fetch(`https://api.notion.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`${method} ${path} failed: ${response.status} ${text}`);
    }

    return text ? JSON.parse(text) : {};
  };
}

async function fetchText(url) {
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Google Calendar iCal fetch failed: ${response.status} ${text}`);
  }
  return text;
}

async function listNotionTaskPages(notion, databaseId) {
  const pages = [];
  let cursor;

  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const data = await notion(`/databases/${databaseId}/query`, "POST", body);
    pages.push(...data.results.filter((page) => !page.archived && !page.in_trash));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return pages;
}

function mapPagesByMarker(pages) {
  const pagesByMarker = new Map();

  for (const page of pages) {
    const notes = getRichText(page, "Notes");
    const marker = extractMarker(notes);
    if (marker) pagesByMarker.set(marker, page);
  }

  return pagesByMarker;
}

function parseIcsEvents(icsText, calendarHash, defaultOffset) {
  const lines = unfoldIcsLines(icsText);
  const events = [];
  let current;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (current) events.push(normalizeEvent(current, calendarHash, defaultOffset));
      current = undefined;
      continue;
    }

    if (!current) continue;
    const parsed = parseIcsLine(line);
    if (!parsed) continue;

    const existing = current[parsed.name];
    if (existing) {
      current[parsed.name] = Array.isArray(existing) ? [...existing, parsed] : [existing, parsed];
    } else {
      current[parsed.name] = parsed;
    }
  }

  return events.filter(Boolean);
}

function unfoldIcsLines(icsText) {
  return icsText.replace(/\r?\n[ \t]/g, "").split(/\r?\n/).map((line) => line.trimEnd());
}

function parseIcsLine(line) {
  const colonIndex = line.indexOf(":");
  if (colonIndex < 0) return undefined;

  const left = line.slice(0, colonIndex);
  const value = line.slice(colonIndex + 1);
  const [rawName, ...paramParts] = left.split(";");
  const params = {};

  for (const part of paramParts) {
    const [key, ...rest] = part.split("=");
    params[key.toUpperCase()] = rest.join("=");
  }

  return {
    name: rawName.toUpperCase(),
    params,
    value,
  };
}

function normalizeEvent(raw, calendarHash, defaultOffset) {
  const uid = firstValue(raw.UID);
  const startProp = firstProp(raw.DTSTART);
  const endProp = firstProp(raw.DTEND);
  const status = firstValue(raw.STATUS);

  if (!uid || !startProp || status === "CANCELLED") return undefined;

  const start = parseIcsDate(startProp, defaultOffset);
  const end = endProp ? parseIcsDate(endProp, defaultOffset) : undefined;
  const rrule = firstValue(raw.RRULE);
  const exdates = allProps(raw.EXDATE).flatMap((prop) => splitIcsDateValues(prop, defaultOffset));
  const title = decodeIcsText(firstValue(raw.SUMMARY) || "(No title)");
  const description = decodeIcsText(firstValue(raw.DESCRIPTION) || "");
  const location = decodeIcsText(firstValue(raw.LOCATION) || "");
  const eventUrl = firstValue(raw.URL) || "";
  const markerBase = `${calendarHash}:${uid}`;

  return {
    uid,
    markerBase,
    marker: `gcal:${markerBase}`,
    title,
    description,
    location,
    eventUrl,
    start,
    end,
    rrule,
    exdates,
    offset: start.offset || defaultOffset,
  };
}

function expandEvents(events, windowStart, windowEnd, defaultOffset) {
  return events.flatMap((event) => expandEvent(event, windowStart, windowEnd, defaultOffset));
}

function expandEvent(event, windowStart, windowEnd, defaultOffset) {
  if (!event.rrule) return isWithinWindow(event.start.date, windowStart, windowEnd) ? [event] : [];

  const rule = parseRrule(event.rrule);
  const occurrences = [];
  const countLimit = Math.min(Number(rule.COUNT || 1000), 1000);
  const until = rule.UNTIL
    ? parseIcsDate({ value: rule.UNTIL, params: {} }, defaultOffset).date
    : windowEnd;
  const durationMs = getDurationMs(event.start, event.end);
  const exdateKeys = new Set(event.exdates.map((dateValue) => occurrenceKey(dateValue.date)));

  let cursor = new Date(event.start.date.getTime());
  let generated = 0;

  while (generated < countLimit && cursor <= until && cursor <= windowEnd) {
    const candidates = recurrenceCandidates(event.start.date, cursor, rule);

    for (const candidate of candidates) {
      if (candidate < event.start.date || candidate > until || candidate > windowEnd) continue;
      if (exdateKeys.has(occurrenceKey(candidate))) continue;

      generated++;
      if (!isWithinWindow(candidate, windowStart, windowEnd)) continue;

      occurrences.push(withOccurrence(event, candidate, durationMs));
      if (generated >= countLimit) break;
    }

    cursor = nextRecurrenceCursor(cursor, rule);
  }

  return dedupeByMarker(occurrences);
}

function parseRrule(rrule) {
  return Object.fromEntries(
    rrule.split(";").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
}

function recurrenceCandidates(originalStart, cursor, rule) {
  const frequency = rule.FREQ;

  if (frequency === "WEEKLY") {
    const byDays = (rule.BYDAY || dayCode(originalStart)).split(",");
    const weekStart = startOfWeek(cursor);
    const timeOfDayMs = originalStart.getTime() - startOfDay(originalStart).getTime();
    return byDays
      .map((code) => new Date(addDays(weekStart, dayNumber(code)).getTime() + timeOfDayMs))
      .sort((a, b) => a - b);
  }

  return [cursor];
}

function nextRecurrenceCursor(cursor, rule) {
  const interval = Math.max(Number(rule.INTERVAL || 1), 1);

  if (rule.FREQ === "DAILY") return addDays(cursor, interval);
  if (rule.FREQ === "WEEKLY") return addDays(cursor, 7 * interval);
  if (rule.FREQ === "MONTHLY") {
    const next = new Date(cursor.getTime());
    next.setUTCMonth(next.getUTCMonth() + interval);
    return next;
  }

  return addDays(cursor, 1);
}

function withOccurrence(event, occurrenceStart, durationMs) {
  const occurrenceEnd = event.end
    ? { ...event.end, date: new Date(occurrenceStart.getTime() + durationMs) }
    : undefined;
  const occurrenceId = `${event.markerBase}:${formatOccurrenceId(occurrenceStart)}`;

  return {
    ...event,
    marker: `gcal:${occurrenceId}`,
    start: { ...event.start, date: occurrenceStart },
    end: occurrenceEnd,
  };
}

function getDurationMs(start, end) {
  if (!end) return 0;
  return Math.max(end.date.getTime() - start.date.getTime(), 0);
}

function parseIcsDate(prop, defaultOffset) {
  const value = prop.value;
  const isDateOnly = prop.params.VALUE === "DATE" || /^\d{8}$/.test(value);

  if (isDateOnly) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6)) - 1;
    const day = Number(value.slice(6, 8));
    return {
      date: new Date(Date.UTC(year, month, day)),
      isDateTime: false,
      offset: defaultOffset,
    };
  }

  const offset = value.endsWith("Z") ? "+00:00" : defaultOffset;
  const clean = value.replace(/Z$/, "");
  const year = clean.slice(0, 4);
  const month = clean.slice(4, 6);
  const day = clean.slice(6, 8);
  const hour = clean.slice(9, 11) || "00";
  const minute = clean.slice(11, 13) || "00";
  const second = clean.slice(13, 15) || "00";
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;

  return {
    date: new Date(iso),
    isDateTime: true,
    offset,
  };
}

function splitIcsDateValues(prop, defaultOffset) {
  return prop.value
    .split(",")
    .filter(Boolean)
    .map((value) => parseIcsDate({ value, params: prop.params }, defaultOffset));
}

async function createTaskPage(notion, databaseId, event) {
  return notion("/pages", "POST", {
    parent: { database_id: databaseId },
    properties: {
      ...eventToProperties(event),
      Status: selectProp("Not started"),
    },
  });
}

async function updateTaskPage(notion, pageId, event) {
  return notion(`/pages/${pageId}`, "PATCH", {
    properties: eventToProperties(event),
  });
}

function eventToProperties(event) {
  return {
    Name: titleProp(event.title),
    Date: dateProp(event),
    Notes: textProp(eventNotes(event)),
  };
}

function eventNotes(event) {
  const parts = [
    `[${GCAL_MARKER_PREFIX} ${event.marker}]`,
    event.description,
    event.location ? `Location: ${event.location}` : "",
    event.eventUrl ? `URL: ${event.eventUrl}` : "",
  ].filter(Boolean);

  return truncate(parts.join("\n\n"), 1900);
}

function pageMatchesEvent(page, event) {
  const title = getTitle(page, "Name");
  const notes = getRichText(page, "Notes");
  const date = page.properties.Date?.date;
  const expectedDate = dateProp(event).date;

  return (
    title === event.title &&
    notes === eventNotes(event) &&
    date?.start === expectedDate.start &&
    (date?.end || null) === (expectedDate.end || null)
  );
}

function dateProp(event) {
  if (!event.start.isDateTime) {
    const start = formatDateOnly(event.start.date);
    const end = event.end ? formatDateOnly(addDays(event.end.date, -1)) : null;

    return {
      date: {
        start,
        end: end && end !== start ? end : null,
      },
    };
  }

  return {
    date: {
      start: formatDateTime(event.start.date, event.start.offset),
      end: event.end ? formatDateTime(event.end.date, event.start.offset) : null,
    },
  };
}

function titleProp(value) {
  return { title: [{ type: "text", text: { content: truncate(value, 1900) } }] };
}

function textProp(value) {
  return { rich_text: value ? [{ type: "text", text: { content: value } }] : [] };
}

function selectProp(value) {
  return { select: value ? { name: value } : null };
}

function getTitle(page, propertyName) {
  return (page.properties[propertyName]?.title || [])
    .map((item) => item.plain_text || item.text?.content || "")
    .join("");
}

function getRichText(page, propertyName) {
  return (page.properties[propertyName]?.rich_text || [])
    .map((item) => item.plain_text || item.text?.content || "")
    .join("");
}

function extractMarker(notes) {
  const match = notes.match(/\[gcal-sync-id:\s*([^\]]+)\]/);
  return match ? match[1].trim() : undefined;
}

function firstProp(value) {
  return Array.isArray(value) ? value[0] : value;
}

function allProps(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function firstValue(value) {
  return firstProp(value)?.value || "";
}

function decodeIcsText(value) {
  return String(value)
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isWithinWindow(date, start, end) {
  return date >= start && date <= end;
}

function startOfWeek(date) {
  const next = new Date(date.getTime());
  next.setUTCHours(0, 0, 0, 0);
  next.setUTCDate(next.getUTCDate() - next.getUTCDay());
  return next;
}

function startOfDay(date) {
  const next = new Date(date.getTime());
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function dayCode(date) {
  return ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][date.getUTCDay()];
}

function dayNumber(code) {
  return { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }[code.slice(-2)] ?? 0;
}

function occurrenceKey(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function formatOccurrenceId(date) {
  return occurrenceKey(date).replace(/[^0-9TZ]/g, "");
}

function dedupeByMarker(events) {
  const seen = new Set();
  return events.filter((event) => {
    if (seen.has(event.marker)) return false;
    seen.add(event.marker);
    return true;
  });
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date, offset) {
  const offsetMinutes = parseOffsetMinutes(offset);
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  const yyyy = local.getUTCFullYear();
  const mm = pad(local.getUTCMonth() + 1);
  const dd = pad(local.getUTCDate());
  const hh = pad(local.getUTCHours());
  const mi = pad(local.getUTCMinutes());
  const ss = pad(local.getUTCSeconds());

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${offset}`;
}

function parseOffsetMinutes(offset) {
  const match = offset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;

  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function hashShort(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function truncate(value, maxLength) {
  return value.length > maxLength ? value.slice(0, maxLength - 1) : value;
}

module.exports = {
  dateProp,
  expandEvents,
  eventNotes,
  parseIcsEvents,
};
