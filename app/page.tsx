import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Gamepad2, Star, Bell, Users } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const steamLoginUrl =
    `https://steamcommunity.com/openid/login?` +
    new URLSearchParams({
      "openid.ns": "http://specs.openid.net/auth/2.0",
      "openid.mode": "checkid_setup",
      "openid.return_to": `${NEXTAUTH_URL}/api/auth/callback/steam`,
      "openid.realm": NEXTAUTH_URL,
      "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
      "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    }).toString();

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1b2838] via-[#1e3a5f] to-[#1b2838] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-4">
          <Gamepad2 size={40} className="text-blue-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Steam Backlog Manager</h1>
        <p className="text-slate-400 text-lg">Behalte deinen Steam-Backlog im Griff</p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-2xl w-full">
        {[
          { icon: Star, title: "Spielzeit-Ranking", desc: "Alle Spiele nach Spielzeit sortiert" },
          { icon: Bell, title: "Gmail-Alerts", desc: "Wochentliche Erinnerungen per E-Mail" },
          { icon: Users, title: "Fur alle", desc: "Jeder kann seinen eigenen Account nutzen" },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center"
          >
            <Icon size={24} className="text-blue-400 mx-auto mb-2" />
            <p className="text-slate-200 font-medium text-sm">{title}</p>
            <p className="text-slate-500 text-xs mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {/* Login Button - direkte URL zu Steam OpenID */}
      <a
        href={`/api/auth/signin/steam`}
        className="flex items-center gap-3 bg-[#1b2838] hover:bg-[#213347] border border-slate-600 hover:border-blue-500 text-white font-semibold py-4 px-8 rounded-xl transition-all text-lg shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
        </svg>
        Mit Steam anmelden
      </a>

      <p className="mt-6 text-slate-600 text-xs">
        Dein Steam-Profil muss offentlich sein fur die Spielzeit-Daten.
      </p>
    </main>
  );
}
