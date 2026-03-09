import nodemailer from "nodemailer";
import type { SteamGame } from "./steam";
import { formatPlaytime, getGameHeaderUrl } from "./steam";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendBacklogDigest(
  to: string,
  userName: string,
  pinnedGames: { appId: string; note: string }[],
  allGames: SteamGame[]
) {
  const pinnedAppIds = new Set(pinnedGames.map((g) => g.appId));
  const topGames = [...allGames]
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 5);

  const pinnedList = pinnedGames
    .map(({ appId, note }) => {
      const game = allGames.find((g) => String(g.appid) === appId);
      if (!game) return "";
      return `
        <tr>
          <td style="padding:8px">
            <img src="${getGameHeaderUrl(game.appid)}" width="120" style="border-radius:4px">
          </td>
          <td style="padding:8px">
            <strong>${game.name}</strong><br>
            <span style="color:#7b93b4">${formatPlaytime(game.playtime_forever)}</span><br>
            ${note ? `<em style="color:#aaa">${note}</em>` : ""}
          </td>
        </tr>`;
    })
    .join("");

  const topList = topGames
    .map(
      (g, i) => `
      <tr>
        <td style="padding:8px;color:#7b93b4;font-weight:bold">#${i + 1}</td>
        <td style="padding:8px"><strong>${g.name}</strong></td>
        <td style="padding:8px;color:#aaa">${formatPlaytime(g.playtime_forever)}</td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#1b2838;color:#c6d4df;font-family:Arial,sans-serif;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#2a475e;border-radius:8px;padding:24px">
    <h1 style="color:#66c0f4;margin-top:0">Steam Backlog Digest</h1>
    <p>Hallo ${userName}, hier ist deine wochentliche Erinnerung!</p>

    ${pinnedGames.length > 0 ? `
    <h2 style="color:#66c0f4">Deine angehefteten Spiele</h2>
    <table style="width:100%;border-collapse:collapse">${pinnedList}</table>
    ` : ""}

    <h2 style="color:#66c0f4">Top 5 meist gespielte Spiele</h2>
    <table style="width:100%;border-collapse:collapse">${topList}</table>

    <p style="color:#7b93b4;font-size:12px;margin-top:24px">
      Diese E-Mail wurde von deinem Steam Backlog Manager gesendet.<br>
      Du kannst Benachrichtigungen in den Einstellungen deactivieren.
    </p>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Steam Backlog Manager" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Steam Backlog Digest - ${new Date().toLocaleDateString("de-DE")}`,
    html,
  });
}
