import { Client } from "@microsoft/microsoft-graph-client";

function getGraphClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

export async function syncToMicrosoftCalendar(
  accessToken: string,
  plan: {
    id: string;
    title: string;
    description?: string;
    plannedDate: Date;
    microsoftEventId?: string | null;
  }
): Promise<string> {
  const client = getGraphClient(accessToken);

  const event = {
    subject: plan.title,
    body: { contentType: "text", content: plan.description ?? "" },
    start: { dateTime: plan.plannedDate.toISOString(), timeZone: "SE Asia Standard Time" },
    end: {
      dateTime: new Date(plan.plannedDate.getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: "SE Asia Standard Time",
    },
  };

  if (plan.microsoftEventId) {
    const res = await client.api(`/me/events/${plan.microsoftEventId}`).patch(event);
    return res.id;
  } else {
    const res = await client.api("/me/events").post(event);
    return res.id;
  }
}

export async function deleteMicrosoftCalendarEvent(accessToken: string, eventId: string) {
  const client = getGraphClient(accessToken);
  await client.api(`/me/events/${eventId}`).delete();
}
