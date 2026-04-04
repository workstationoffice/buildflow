import { Client } from "@line/bot-sdk";

function getLineClient() {
  return new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    channelSecret: process.env.LINE_CHANNEL_SECRET!,
  });
}

export interface CheckInLineData {
  workerName: string;
  workerRole: string;
  siteName: string;
  checkInTime: string;
  latitude: number;
  longitude: number;
  dealTitle?: string;
}

export async function sendCheckInLineNotification(groupId: string, data: CheckInLineData) {
  const mapsLink = `https://maps.google.com/?q=${data.latitude},${data.longitude}`;

  const message = [
    `📍 Check-in Notification`,
    `👤 ${data.workerName} (${data.workerRole})`,
    `🏢 Site: ${data.siteName}`,
    `🕐 Time: ${data.checkInTime}`,
    data.dealTitle ? `💼 Deal: ${data.dealTitle}` : null,
    `📌 Location: ${mapsLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  await getLineClient().pushMessage(groupId, {
    type: "text",
    text: message,
  });
}
