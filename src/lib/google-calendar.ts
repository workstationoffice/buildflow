import { google } from "googleapis";

export async function syncToGoogleCalendar(
  accessToken: string,
  plan: {
    id: string;
    title: string;
    description?: string;
    plannedDate: Date;
    googleEventId?: string | null;
  }
): Promise<string> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: plan.title,
    description: plan.description ?? "",
    start: { dateTime: plan.plannedDate.toISOString(), timeZone: "Asia/Bangkok" },
    end: {
      dateTime: new Date(plan.plannedDate.getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: "Asia/Bangkok",
    },
  };

  if (plan.googleEventId) {
    const res = await calendar.events.update({
      calendarId: "primary",
      eventId: plan.googleEventId,
      requestBody: event,
    });
    return res.data.id!;
  } else {
    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
    return res.data.id!;
  }
}

export async function deleteGoogleCalendarEvent(accessToken: string, eventId: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: "primary", eventId });
}
