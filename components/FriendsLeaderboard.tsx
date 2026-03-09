"use client";

import { useState, useEffect } from "react";
import { Users, Trophy, Clock, Gamepad2, RefreshCw, Lock, ExternalLink } from "lucide-react";
import type { FriendStats } from "@/app/api/friends/route";

export default function FriendsLeaderboard({ myName }: { myName: string }) {
  const [friends, setFriends] = useState<FriendStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [total, setTotal] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends ?? []);
        setIsPrivate(data.isPrivate ?? false);
        setTotal(data.total ?? 0);
        setLoaded(true);
      }
    } finally {
      setLoading(false);
    }
  }

  const myRank = friends.findIndex((f) => f.name.startsWith(myName));

  const medalColor = (rank: number) =>
    rank === 0 ? "text-yellow-400" : rank === 1 ? "text-slate-300" : rank === 2 ? "text-amber-600" : "text-slate-500";

  const medalBg = (rank: number) =>
    rank === 0 ? "bg-yellow-400/10 border-yellow-400/30" : rank === 1 ? "bg-slate-300/10 border-slate-300/20" : rank === 2 ? "bg-amber-600/10 border-amber-600/20" : "bg-slate-800/40 border-slate-700/50";

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Users size={15} className="text-blue-400" />
          Freundes-Rangliste
          {total > 0 && <span className="text-xs text-slate-500">({total} Freunde)</span>}
        </h2>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50 bg-slate-700 hover:bg-slate-600 px-2.5 py-1.5 rounded-lg"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {loaded ? "Aktualisieren" : "Laden"}
        </button>
      </div>

      {!loaded && !loading && (
        <div className="p-8 text-center">
          <Users size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-1">Vergleiche dich mit deinen Steam-Freunden</p>
          <p className="text-slate-600 text-xs">Gesamte Spielzeit · Meistgespieltes Spiel · Rangliste</p>
          <button onClick={load}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
            Rangliste laden
          </button>
        </div>
      )}

      {loading && (
        <div className="p-8 text-center">
          <RefreshCw size={28} className="text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Lade Freundesdaten von Steam...</p>
          <p className="text-slate-600 text-xs mt-1">Kann einen Moment dauern</p>
        </div>
      )}

      {loaded && isPrivate && (
        <div className="p-8 text-center">
          <Lock size={28} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Freundesliste ist privat</p>
          <p className="text-slate-600 text-xs mt-1">Stelle dein Steam-Profil auf "Öffentlich"</p>
        </div>
      )}

      {loaded && !isPrivate && friends.length > 0 && (
        <>
          {/* My rank highlight */}
          {myRank >= 0 && (
            <div className="px-4 py-2 bg-blue-600/10 border-b border-blue-500/20 text-xs text-blue-300 flex items-center gap-1.5">
              <Trophy size={11} />
              Du bist auf Platz {myRank + 1} von {friends.length}
            </div>
          )}

          <div className="divide-y divide-slate-700/30 max-h-[500px] overflow-y-auto">
            {friends.map((f, i) => {
              const isMe = f.name.includes("(Du)");
              return (
                <div
                  key={f.steamId}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? "bg-blue-600/10" : "hover:bg-slate-700/30"}`}
                >
                  {/* Rank */}
                  <span className={`w-6 text-center font-bold text-sm shrink-0 ${medalColor(i)}`}>
                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
                  </span>

                  {/* Avatar */}
                  {f.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.avatar} alt={f.name} className={`w-9 h-9 rounded-full shrink-0 border-2 ${isMe ? "border-blue-500" : "border-transparent"}`} />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-700 shrink-0 flex items-center justify-center">
                      <Users size={14} className="text-slate-500" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-medium truncate ${isMe ? "text-blue-300" : "text-slate-200"}`}>{f.name}</p>
                      {!f.isPrivate && (
                        <a href={f.profileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-slate-600 hover:text-slate-400 transition-colors shrink-0">
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    {f.isPrivate ? (
                      <p className="text-xs text-slate-600 flex items-center gap-1"><Lock size={9} /> Privates Profil</p>
                    ) : (
                      <p className="text-xs text-slate-500 truncate">
                        {f.topGame ? `▶ ${f.topGame.name} (${f.topGame.hours}h)` : "Keine Daten"}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  {!f.isPrivate && (
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-bold ${isMe ? "text-blue-300" : medalColor(i)}`}>
                        {f.totalHours.toLocaleString()}h
                      </p>
                      <p className="text-xs text-slate-600 flex items-center gap-1 justify-end">
                        <Gamepad2 size={9} />{f.totalGames}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-4 py-2 border-t border-slate-700/30 text-xs text-slate-600 flex items-center gap-1">
            <Clock size={10} /> Nur öffentliche Profile · max. 50 Freunde
          </div>
        </>
      )}
    </div>
  );
}
