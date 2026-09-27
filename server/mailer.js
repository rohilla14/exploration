import nodemailer from 'nodemailer';
import { randomUUID } from 'crypto';

// IST has no daylight saving, so this is a fixed offset from UTC.
const IST_OFFSET_MIN = 5 * 60 + 30;
const DEFAULT_DURATION_HOURS = 3;

export function credentialsConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.PARTNER_EMAIL &&
      process.env.HER_EMAIL
  );
}

/** Build the transport fresh each time (env vars, not a module-load-time constant). */
function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/** "7:00 PM" → { hour24: 19, minute: 0 }. Returns null if it does not parse. */
function parseDisplayTime(text) {
  const m = String(text ?? '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hour = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') hour += 12;
  return { hour24: hour, minute: Number(m[2]) };
}

/**
 * Turn `selectedDate` ("YYYY-MM-DD") + `selectedTime` ("7:00 PM"), read as India time, into a
 * UTC start/end pair for the calendar invite.
 * @returns {{ start: Date, end: Date } | null}
 */
function resolveDateWindow(selectedDate, selectedTime) {
  const dateMatch = String(selectedDate ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const time = parseDisplayTime(selectedTime);
  if (!dateMatch || !time) return null;

  const [, y, mo, d] = dateMatch.map(Number);
  const localMinutes = time.hour24 * 60 + time.minute;
  const startMs = Date.UTC(y, mo - 1, d, 0, 0) + (localMinutes - IST_OFFSET_MIN) * 60000;
  const durationHours = Number(process.env.DATE_DURATION_HOURS) || DEFAULT_DURATION_HOURS;

  return { start: new Date(startMs), end: new Date(startMs + durationHours * 3600000) };
}

function icsStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

/** Escape text for use inside an ICS field (RFC 5545 §3.3.11). */
function icsEscape(text) {
  return String(text ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * A minimal, valid RFC5545 VEVENT with method REQUEST, so calendar apps offer an
 * Accept/Decline UI rather than just showing a text attachment.
 */
function buildIcs({ uid, start, end, summary, description, location, organizerEmail, attendeeEmails }) {
  const now = icsStamp(new Date());
  const attendees = attendeeEmails
    .map(
      (email) =>
        `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${email}`
    )
    .join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'PRODID:-//Our World//date-planner//EN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    location ? `LOCATION:${icsEscape(location)}` : null,
    `ORGANIZER:mailto:${organizerEmail}`,
    attendees,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/**
 * Email both of them a calendar invite for the day she just locked in, so it lands directly
 * in her calendar and you see exactly what she picked without opening /admin. Silently does
 * nothing if the mail env vars are not set — this must never fail the confirmation itself.
 * @param {{ selectedDate: string, selectedTime: string, activities?: { place: string, emoji?: string }[] }} plan
 * @param {{ transport?: import('nodemailer').Transporter }} [options] injectable transport for tests
 */
export async function sendDateConfirmationEmails(plan, { transport } = {}) {
  if (!credentialsConfigured()) return { sent: false, reason: 'not_configured' };

  const window = resolveDateWindow(plan.selectedDate, plan.selectedTime);
  if (!window) return { sent: false, reason: 'unparseable_date_or_time' };

  const stops = (plan.activities ?? []).map((a) => `${a.emoji ?? ''} ${a.place}`.trim());
  const summary = stops.length ? `Our date: ${stops[0]}${stops.length > 1 ? ', +' : ''}` : 'Our date';
  const description = stops.length
    ? `The plan:\n${stops.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    : "She locked it in. That's all we know for now.";

  const her = process.env.HER_EMAIL;
  const you = process.env.PARTNER_EMAIL;
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const uid = `${randomUUID()}@our-world`;

  const ics = buildIcs({
    uid,
    start: window.start,
    end: window.end,
    summary,
    description,
    location: stops[0] ?? '',
    organizerEmail: from,
    attendeeEmails: [her, you],
  });

  const mailer = transport ?? createTransport();
  const dateLine = window.start.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  });

  const send = (to, bodyIntro) =>
    mailer.sendMail({
      from,
      to,
      subject: `It's a date — ${dateLine}`,
      text: `${bodyIntro}\n\n${dateLine}\n\n${description}\n\nIt's on the calendar. See you there.`,
      icalEvent: { filename: 'our-date.ics', method: 'REQUEST', content: ics },
    });

  const results = await Promise.allSettled([
    send(her, "It's a date."),
    send(you, `${stops.length ? 'She picked' : 'She locked in a date'}:`),
  ]);

  return {
    sent: results.some((r) => r.status === 'fulfilled'),
    errors: results.filter((r) => r.status === 'rejected').map((r) => r.reason?.message),
  };
}

// Exposed for tests only.
export const __internal = { resolveDateWindow, buildIcs, parseDisplayTime };
