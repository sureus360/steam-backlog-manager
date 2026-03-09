"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Gamepad2, LogOut, Search, Pin, Trophy, RefreshCw, ChevronDown, Users, Bell,
} from "lucide-react";
import GameCard from "@/components/GameCard";
import NotificationSettings from "@/components/NotificationSettings";
import FriendsLeaderboard from "@/components/FriendsLeaderboard";
import type { SteamGame } from "@/lib/steam";
import type { SessionData } from "@/lib/session";

type SortMode = "playtime" | "name" | "recent";
interface PinnedGameData { appId: string; note: string; }

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [games, setGames] = useState<SteamGame[]>([]);
  const [pins, setPins] = useState<PinnedGameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("playtime");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  // Load session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) { router.push("/"); return; }
        setSession(data);
      })
      .finally(() => setAuthLoading(false));
  }, [router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [gamesRes, pinsRes] = await Promise.all([
        fetch("/api/games"),
        fetch("/api/pins"),
      ]);
      if (gamesRes.ok) setGames(await gamesRes.json());
      if (pinsRes.ok) setPins(await pinsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) loadData();
  }, [session, loadData]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  async function togglePin(appId: number) {
    const appIdStr = String(appId);
    const isPinned = pins.some((p) => p.appId === appIdStr);
    if (isPinned) {
      await fetch("/api/pins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: appIdStr }),
      });
      setPins((prev) => prev.filter((p) => p.appId !== appIdStr));
    } else {
      const res = await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: appIdStr }),
      });
      if (res.ok) {
        const pin = await res.json();
        setPins((prev) => [...prev, pin]);
      }
    }
  }

  const pinnedIds = new Set(pins.map((p) => p.appId));

  const sorted = [...games].sort((a, b) => {
    if (sortMode === "name") return a.name.localeCompare(b.name);
    if (sortMode === "recent") return (b.playtime_2weeks ?? 0) - (a.playtime_2weeks ?? 0);
    return b.playtime_forever - a.playtime_forever;
  });

  const filtered = sorted.filter((g) => {
    if (showPinnedOnly && !pinnedIds.has(String(g.appid))) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const displayed = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = displayed.length < filtered.length;
  const pinnedGames = games.filter((g) => pinnedIds.has(String(g.appid)));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1b2838] flex items-center justify-center">
        <RefreshCw size={32} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1b2838] text-slate-100">
      {/* Header */}
      <header className="bg-[#171a21]/80 backdrop-blur border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 size={22} className="text-blue-400" />
            <span className="font-bold text-slate-100">Backlog Manager</span>
          </div>
          <div className="flex items-center gap-3">
            {session?.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-600" />
            )}
            <span className="text-sm text-slate-300 hidden sm:block">{session?.name}</span>
            <button
              onClick={logout}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1.5 rounded-md hover:bg-slate-700"
              title="Abmelden"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-4">
          {/* Stats */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <h2 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-1.5">
              <Trophy size={14} className="text-yellow-400" />
              Ubersicht
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-slate-100">{games.length}</p>
                <p className="text-xs text-slate-500">Spiele total</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-blue-400">{pins.length}</p>
                <p className="text-xs text-slate-500">Angeheftet</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 col-span-2">
                <p className="text-2xl font-bold text-slate-100">
                  {Math.floor(games.reduce((s, g) => s + g.playtime_forever, 0) / 60).toLocaleString()}h
                </p>
                <p className="text-xs text-slate-500">Spielstunden gesamt</p>
              </div>
            </div>
          </div>

          {/* Pinned Games */}
          {pinnedGames.length > 0 && (
            <div className="bg-slate-800/60 rounded-xl p-4 border border-blue-500/20">
              <h2 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-1.5">
                <Pin size={14} /> Angeheftete Spiele
              </h2>
              <div className="space-y-2">
                {pinnedGames.map((g) => (
                  <div key={g.appid} className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`}
                      alt={g.name}
                      className="w-14 h-8 object-cover rounded"
                    />
                    <div className="min-w-0">
                      <p className="text-slate-200 truncate text-xs">{g.name}</p>
                      <p className="text-slate-500 text-xs">{Math.floor(g.playtime_forever / 60)}h</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 hover:border-blue-500/40 transition-colors"
          >
            <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Bell size={14} className="text-blue-400" />Benachrichtigungen
            </span>
            <ChevronDown size={16} className={`text-slate-500 transition-transform ${showSettings ? "rotate-180" : ""}`} />
          </button>
          {showSettings && session?.steamId && (
            <NotificationSettings steamId={session.steamId} />
          )}

          {/* Friends Toggle */}
          <button
            onClick={() => setShowFriends(!showFriends)}
            className="w-full flex items-center justify-between bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 hover:border-blue-500/40 transition-colors"
          >
            <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Users size={14} className="text-blue-400" />Freundes-Rangliste
            </span>
            <ChevronDown size={16} className={`text-slate-500 transition-transform ${showFriends ? "rotate-180" : ""}`} />
          </button>
          {showFriends && session?.name && (
            <FriendsLeaderboard myName={session.name} />
          )}
        </aside>

        {/* Game List */}
        <main className="lg:col-span-2 space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Spiel suchen..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="playtime">Nach Spielzeit</option>
              <option value="name">Nach Name</option>
              <option value="recent">Zuletzt gespielt</option>
            </select>
            <button
              onClick={() => { setShowPinnedOnly(!showPinnedOnly); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                showPinnedOnly
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              <Pin size={13} /> Gepinnt
            </button>
            <button
              onClick={loadData}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <p className="text-xs text-slate-500">
            {filtered.length} Spiele{search ? ` für "${search}"` : ""} |{" "}
            {Math.floor(filtered.reduce((s, g) => s + g.playtime_forever, 0) / 60).toLocaleString()}h
          </p>

          {loading ? (
            <div className="flex justify-center py-20">
              <RefreshCw size={28} className="text-blue-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-500">Keine Spiele gefunden</div>
          ) : (
            <div className="space-y-1.5">
              {displayed.map((game) => (
                <GameCard
                  key={game.appid}
                  game={game}
                  rank={filtered.indexOf(game) + 1}
                  isPinned={pinnedIds.has(String(game.appid))}
                  onTogglePin={togglePin}
                />
              ))}
            </div>
          )}

          {hasMore && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="w-full py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors text-sm"
            >
              Mehr laden ({filtered.length - displayed.length} weitere)
            </button>
          )}
        </main>
      </div>
    </div>
  );
}
