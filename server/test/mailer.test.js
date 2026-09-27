import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.SMTP_HOST = 'smtp.example.test';
process.env.SMTP_USER = 'us@example.test';
process.env.SMTP_PASS = 'x';
process.env.PARTNER_EMAIL = 'him@example.test';
process.env.HER_EMAIL = 'her@example.test';
process.env.MAIL_FROM = 'us@example.test';
process.env.DATE_DURATION_HOURS = '2';

const { sendDateConfirmationEmails, credentialsConfigured, __internal } = await import(
  '../mailer.js'
);

test('credentialsConfigured is false unless every mail env var is set', () => {
  assert.equal(credentialsConfigured(), true);
  const saved = process.env.HER_EMAIL;
  delete process.env.HER_EMAIL;
  assert.equal(credentialsConfigured(), false);
  process.env.HER_EMAIL = saved;
});

test('resolveDateWindow reads "7:00 PM" IST correctly and applies the duration', () => {
  const { start, end } = __internal.resolveDateWindow('2026-09-28', '7:00 PM');
  // 7:00 PM IST = 13:30 UTC.
  assert.equal(start.toISOString(), '2026-09-28T13:30:00.000Z');
  assert.equal(end.toISOString(), '2026-09-28T15:30:00.000Z');
});

test('resolveDateWindow rejects anything it cannot parse', () => {
  assert.equal(__internal.resolveDateWindow('not-a-date', '7:00 PM'), null);
  assert.equal(__internal.resolveDateWindow('2026-09-28', 'seven pm'), null);
});

test('buildIcs produces a valid REQUEST invite with both attendees', () => {
  const ics = __internal.buildIcs({
    uid: 'test-uid@our-world',
    start: new Date('2026-09-28T13:30:00.000Z'),
    end: new Date('2026-09-28T15:30:00.000Z'),
    summary: 'Our date: Blue Tokai',
    description: 'The plan:\n1. Blue Tokai',
    location: 'Blue Tokai',
    organizerEmail: 'us@example.test',
    attendeeEmails: ['her@example.test', 'us@example.test'],
  });

  assert.match(ics, /^BEGIN:VCALENDAR/);
  assert.match(ics, /METHOD:REQUEST/);
  assert.match(ics, /DTSTART:20260928T133000Z/);
  assert.match(ics, /DTEND:20260928T153000Z/);
  assert.match(ics, /SUMMARY:Our date: Blue Tokai/);
  assert.match(ics, /ORGANIZER:mailto:us@example\.test/);
  assert.match(ics, /ATTENDEE.*mailto:her@example\.test/);
  assert.match(ics, /ATTENDEE.*mailto:us@example\.test/);
  assert.match(ics, /END:VCALENDAR\s*$/);
});

test('buildIcs escapes text so a comma or newline in a place name cannot break the file', () => {
  const ics = __internal.buildIcs({
    uid: 'u',
    start: new Date(),
    end: new Date(),
    summary: 'Coffee, then a walk',
    description: 'Line one\nLine two',
    location: '',
    organizerEmail: 'us@example.test',
    attendeeEmails: ['her@example.test'],
  });
  assert.match(ics, /SUMMARY:Coffee\\, then a walk/);
  assert.match(ics, /DESCRIPTION:Line one\\nLine two/);
});

test('sendDateConfirmationEmails sends one invite to her and one to him, both with the ics attached', async () => {
  const sent = [];
  const fakeTransport = {
    sendMail: async (opts) => {
      sent.push(opts);
      return { messageId: 'fake' };
    },
  };

  const result = await sendDateConfirmationEmails(
    {
      selectedDate: '2026-09-28',
      selectedTime: '7:00 PM',
      activities: [{ place: 'Blue Tokai', emoji: '☕' }, { place: 'Lodhi Garden', emoji: '🌿' }],
    },
    { transport: fakeTransport }
  );

  assert.equal(result.sent, true);
  assert.equal(sent.length, 2);

  const recipients = sent.map((m) => m.to).sort();
  assert.deepEqual(recipients, ['her@example.test', 'him@example.test']);

  for (const mail of sent) {
    assert.equal(mail.from, 'us@example.test');
    assert.equal(mail.icalEvent.method, 'REQUEST');
    assert.match(mail.icalEvent.content, /DTSTART:20260928T133000Z/);
    // The comma is correctly escaped per RFC5545 (see the dedicated escaping test above).
    assert.match(mail.icalEvent.content, /SUMMARY:Our date: ☕ Blue Tokai\\, \+/);
    assert.match(mail.text, /Blue Tokai/);
    assert.match(mail.text, /Lodhi Garden/);
  }
});

test('sendDateConfirmationEmails is a no-op when mail env vars are not set', async () => {
  const saved = process.env.SMTP_HOST;
  delete process.env.SMTP_HOST;
  let called = false;
  const result = await sendDateConfirmationEmails(
    { selectedDate: '2026-09-28', selectedTime: '7:00 PM' },
    { transport: { sendMail: async () => { called = true; } } }
  );
  assert.equal(result.sent, false);
  assert.equal(called, false);
  process.env.SMTP_HOST = saved;
});

test('sendDateConfirmationEmails still reports partial success if one address fails', async () => {
  const fakeTransport = {
    sendMail: async (opts) => {
      if (opts.to === 'her@example.test') throw new Error('mailbox full');
      return { messageId: 'ok' };
    },
  };
  const result = await sendDateConfirmationEmails(
    { selectedDate: '2026-09-28', selectedTime: '7:00 PM' },
    { transport: fakeTransport }
  );
  assert.equal(result.sent, true);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /mailbox full/);
});
