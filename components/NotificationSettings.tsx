"use client";

import { useState, useEffect } from "react";
import { Bell, Plus, Trash2, Send, CheckCircle, AlertCircle, Mail } from "lucide-react";

interface Schedule { id: string; day: string; hour: number; }

const DAYS = [
  { value: "monday", label: "Montag" },
  { value: "tuesday", label: "Dienstag" },
  { value: "wednesday", label: "Mittwoch" },
  { value: "thursday", label: "Donnerstag" },
  { value: "friday", label: "Freitag" },
  { value: "saturday", label: "Samstag" },
  { value: "sunday", label: "Sonntag" },
];

const DAY_LABEL: Record<string, string> = Object.fromEntries(DAYS.map((d) => [d.value, d.label]));

export default function NotificationSettings({ steamId }: { steamId: string }) {
  const [email, setEmail] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [newDay, setNewDay] = useState("monday");
  const [newHour, setNewHour] = useState(9);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "sending">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => { if (!d.error) { setEmail(d.email ?? ""); setSchedules(d.schedules ?? []); } });
  }, []);

  function flash(s: typeof status, m: string) {
    setStatus(s); setMsg(m);
    setTimeout(() => setStatus("idle"), 3000);
  }

  async function saveEmail() {
    setStatus("saving");
    const res = await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    res.ok ? flash("saved", "E-Mail gespeichert!") : flash("error", "Fehler beim Speichern");
  }

  async function addSchedule() {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day: newDay, hour: newHour, email }),
    });
    if (res.ok) {
      const s = await res.json();
      setSchedules((prev) => [...prev, s].sort((a, b) => a.day.localeCompare(b.day) || a.hour - b.hour));
      flash("saved", "Zeitpunkt hinzugefügt!");
    } else {
      flash("error", "Fehler");
    }
  }

  async function removeSchedule(id: string) {
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  async function sendTest() {
    if (!email) { flash("error", "Bitte zuerst E-Mail eingeben!"); return; }
    setStatus("sending");
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steamId }),
    });
    const d = await res.json();
    res.ok ? flash("saved", "Test-E-Mail gesendet!") : flash("error", d.error ?? "Fehler");
  }

  return (
    <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50 space-y-4">
      <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
        <Bell size={15} className="text-blue-400" />
        Gmail-Benachrichtigungen
      </h2>

      {/* Email */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">
          <Mail size={11} className="inline mr-1" />E-Mail-Adresse
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@gmail.com"
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
          />
          <button onClick={saveEmail} disabled={status === "saving"}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors disabled:opacity-50">
            {status === "saving" ? "..." : "Speichern"}
          </button>
        </div>
      </div>

      {/* Existing schedules */}
      {schedules.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-400">Aktive Zeitpunkte</p>
          {schedules.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-slate-900/60 rounded-lg px-3 py-2">
              <span className="text-sm text-slate-200">
                {DAY_LABEL[s.day]} um {String(s.hour).padStart(2, "0")}:00 Uhr
              </span>
              <button onClick={() => removeSchedule(s.id)}
                className="text-slate-500 hover:text-red-400 transition-colors p-1">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new schedule */}
      <div className="border border-slate-700 rounded-lg p-3 space-y-2">
        <p className="text-xs text-slate-400 flex items-center gap-1"><Plus size={11} /> Zeitpunkt hinzufügen</p>
        <div className="flex gap-2">
          <select value={newDay} onChange={(e) => setNewDay(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500">
            {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <select value={newHour} onChange={(e) => setNewHour(Number(e.target.value))}
            className="w-24 bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500">
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
            ))}
          </select>
          <button onClick={addSchedule}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Status */}
      {status !== "idle" && status !== "saving" && status !== "sending" && (
        <div className={`flex items-center gap-2 text-sm ${status === "saved" ? "text-green-400" : "text-red-400"}`}>
          {status === "saved" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}{msg}
        </div>
      )}

      {/* Test send */}
      <button onClick={sendTest} disabled={status === "sending"}
        className="w-full flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors disabled:opacity-50">
        <Send size={13} />
        {status === "sending" ? "Wird gesendet..." : "Test-E-Mail senden"}
      </button>
    </div>
  );
}
