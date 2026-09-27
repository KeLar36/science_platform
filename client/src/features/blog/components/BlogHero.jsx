import React from "react";
import {
  Newspaper,
  Sparkles,
  TrendingUp,
  Rss,
  ArrowUpRight,
} from "lucide-react";

export default function BlogHero() {
  return (
    <div className="w-full text-left py-8 md:py-12 relative overflow-hidden select-none border-b border-border-color/60">
      <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.07] pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute -top-12 -right-12 w-80 h-80 bg-brand/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-5xl">
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
          </span>
          <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-[0.2em]">
            Science Platform Press // Live Feed
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-text-primary uppercase leading-none font-sans">
            Дайджест <span className="text-brand">Науки</span> & Інновацій
          </h1>
          <p className="text-sm md:text-base font-medium text-text-secondary max-w-2xl leading-relaxed tracking-wide opacity-90">
            Офіційний медіа-простір платформи. Експертні матеріали про грантові
            програми, методологічні рекомендації, анотації фахових досліджень та
            інтерв’ю з науковцями.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3 md:gap-6 text-xs font-mono text-text-muted">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary/80 border border-border-color/80">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>Гранти & Фінансування</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary/80 border border-border-color/80">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Аналітика ринку</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary/80 border border-border-color/80">
            <Newspaper className="w-3.5 h-3.5 text-purple-400" />
            <span>Методологія</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-brand hover:underline cursor-pointer ml-auto font-bold uppercase tracking-wider">
            <Rss className="w-3 h-3" />
            <span>RSS Потік</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
