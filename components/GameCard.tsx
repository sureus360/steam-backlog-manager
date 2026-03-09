"use client";

import Image from "next/image";
import { Pin, PinOff, Clock, TrendingUp } from "lucide-react";
import { formatPlaytime, getGameHeaderUrl, type SteamGame } from "@/lib/steam";

interface Props {
  game: SteamGame;
  rank: number;
  isPinned: boolean;
  onTogglePin: (appId: number) => void;
}

export default function GameCard({ game, rank, isPinned, onTogglePin }: Props) {
  const hours = Math.floor(game.playtime_forever / 60);
  const recentlyPlayed = (game.playtime_2weeks ?? 0) > 0;

  const rankColor =
    rank === 1
      ? "text-yellow-400"
      : rank === 2
      ? "text-gray-300"
      : rank === 3
      ? "text-amber-600"
      : "text-slate-400";

  return (
    <div
      className={`relative flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-slate-700/50 ${
        isPinned ? "bg-slate-700/40 ring-1 ring-blue-500/40" : "bg-slate-800/60"
      }`}
    >
      {/* Rank Badge */}
      <span className={`w-8 text-center font-bold text-sm shrink-0 ${rankColor}`}>
        #{rank}
      </span>

      {/* Game Image */}
      <div className="relative w-24 h-14 shrink-0 rounded overflow-hidden bg-slate-700">
        <Image
          src={getGameHeaderUrl(game.appid)}
          alt={game.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100 truncate">{game.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock size={11} />
            {formatPlaytime(game.playtime_forever)}
          </span>
          {recentlyPlayed && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <TrendingUp size={11} />
              {formatPlaytime(game.playtime_2weeks ?? 0)} (2 Wochen)
            </span>
          )}
        </div>
      </div>

      {/* Pin Button */}
      <button
        onClick={() => onTogglePin(game.appid)}
        className={`shrink-0 p-1.5 rounded-md transition-colors ${
          isPinned
            ? "text-blue-400 bg-blue-500/20 hover:bg-blue-500/30"
            : "text-slate-500 hover:text-slate-300 hover:bg-slate-700"
        }`}
        title={isPinned ? "Entpinnen" : "Anpinnen"}
      >
        {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
      </button>

      {/* Pinned Indicator */}
      {isPinned && (
        <span className="absolute top-1.5 right-9 text-[10px] text-blue-400 font-medium">
          Angeheftet
        </span>
      )}
    </div>
  );
}
