"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Mail, Send, CheckCircle, AlertCircle } from "lucide-react";

interface Settings {
  email: string;
  emailNotify: boolean;
  notifyDay: string;
  notifyHour: number;
}

const DAYS = [
  { value: "monday", label: "Montag" },
  { value: "tuesday", label: "Dienstag" },
  { value: "wednesday", label: "Mittwoch" },
  { value: "thursday", label: "Donnerstag" },
  { value: "friday", label: "Freitag" },
  { value: "saturday", label: "Samstag" },
  { value: "sunday", label: "Sonntag" },
];

export default function NotificationSettings({ steamId }: { steamId: string }) {
  const [settings, setSettings] = useState<Settings>({
    email: "",
    emailNotify: false,
    notifyDay: "monday",
    notifyHour: 9,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "sending">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings({
            email: data.email ?? "",
            emailNotify: data.emailNotify ?? false,
            notifyDay: data.notifyDay ?? "monday",
            notifyHour: data.notifyHour ?? 9,
          });
        }
      });
  }, []);

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setStatus("saved");
        setMessage("Einstellungen gespeichert!");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setMessage("Fehler beim Speichern");
      }
    } catch {
      setStatus("error");
      setMessage("Verbindungsfehler");
    }
  }

  async function sendTest() {
    if (!settings.email) {
      setStatus("error");
      setMessage("Bitte zuerst E-Mail-Adresse eingeben und speichern!");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamId }),
      });
      if (res.ok) {
        setStatus("saved");
        setMessage("Test-E-Mail gesendet!");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        const err = await res.json();
        setStatus("error");
        setMessage(err.error ?? "Fehler beim Senden");
        setTimeout(() => setStatus("idle"), 4000);
      }
    } catch {
      setStatus("error");
      setMessage("Verbindungsfehler");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
        <Bell size={18} className="text-blue-400" />
        Gmail-Benachrichtigungen
      </h2>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-xs text-slate-400 mb-1.5">
          <Mail size={11} className="inline mr-1" />
          Gmail-Adresse
        </label>
        <input
          type="email"
          value={settings.email}
          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
          placeholder="deine@gmail.com"
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setSettings({ ...settings, emailNotify: !settings.emailNotify })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.emailNotify ? "bg-blue-600" : "bg-slate-600"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.emailNotify ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm text-slate-300">
          {settings.emailNotify ? (
            <span className="flex items-center gap-1 text-green-400">
              <Bell size={13} /> Benachrichtigungen aktiv
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400">
              <BellOff size={13} /> Benachrichtigungen deaktiviert
            </span>
          )}
        </span>
      </div>

      {/* Schedule */}
      {settings.emailNotify && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5">Wochentag</label>
            <select
              value={settings.notifyDay}
              onChange={(e) => setSettings({ ...settings, notifyDay: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs text-slate-400 mb-1.5">Uhrzeit</label>
            <select
              value={settings.notifyHour}
              onChange={(e) => setSettings({ ...settings, notifyHour: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Status */}
      {status !== "idle" && status !== "saving" && status !== "sending" && (
        <div
          className={`flex items-center gap-2 text-sm mb-3 ${
            status === "saved" ? "text-green-400" : "text-red-400"
          }`}
        >
          {status === "saved" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {message}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={status === "saving"}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {status === "saving" ? "Speichern..." : "Speichern"}
        </button>
        <button
          onClick={sendTest}
          disabled={status === "sending"}
          className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 text-sm py-2 px-3 rounded-lg transition-colors"
          title="Test-E-Mail senden"
        >
          <Send size={14} />
          {status === "sending" ? "Senden..." : "Test"}
        </button>
      </div>
    </div>
  );
}
