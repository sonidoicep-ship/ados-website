"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SplitBar } from "@/components/ui/SplitBar";
import { cn, formatDate } from "@/lib/utils";
import type { Activity } from "@/lib/types";
import { CountUp } from "./home-ui";

const JUEGOS_COLOR = "var(--color-primary)";
// Darker step of the brand lime: the lime itself is too light to read as a bar on white
const SOCIAL_COLOR = "#6AA000";

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** Stacked columns of attendance per activity (juegos + social), with a readout of the selected one. */
export function AttendanceChart({ activities }: { activities: Activity[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const rows = [...activities]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((a) => {
      const total = (a.asistentes || []).length;
      const social = (a.socials || []).length; // socials are a subset of asistentes
      return { id: a.id, titulo: a.titulo, fecha: a.fecha, total, social, juegos: total - social };
    });

  if (rows.length === 0) return null;

  const selected = rows.find((r) => r.id === selectedId) ?? rows[rows.length - 1];
  const max = Math.max(...rows.map((r) => r.total), 1);
  const totalAll = rows.reduce((sum, r) => sum + r.total, 0);
  const socialAll = rows.reduce((sum, r) => sum + r.social, 0);

  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex items-baseline gap-2">
          <CountUp
            value={Math.round(totalAll / rows.length)}
            className="text-3xl font-black tracking-tight text-foreground"
          />
          <span className="text-sm font-bold text-muted-foreground">promedio por actividad</span>
        </div>
        <Legend juegos={percent(totalAll - socialAll, totalAll)} social={percent(socialAll, totalAll)} />
      </div>

      {/* shortcut: bars shrink to 8px and then scroll sideways; past ~30 activities, show a date range instead */}
      <div className="flex h-36 items-end gap-1 overflow-x-auto border-b border-border">
        {rows.map((r, i) => {
          const isSelected = r.id === selected.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedId(r.id)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setSelectedId(r.id)}
              onFocus={() => setSelectedId(r.id)}
              aria-pressed={isSelected}
              aria-label={`${r.titulo || "Actividad"}, ${formatDate(r.fecha)}: ${r.total} presentes, ${r.juegos} en juegos, ${r.social} en social`}
              className={cn(
                "flex h-full min-w-2 flex-1 flex-col items-center justify-end rounded-t-md transition-opacity focus-visible:outline-2 focus-visible:outline-primary",
                !isSelected && "opacity-45 hover:opacity-70",
              )}
            >
              {/* The whole slot is the hit target; the bar is capped at 24px and centered in it */}
              <motion.div
                className="flex w-full max-w-6 origin-bottom flex-col gap-0.5"
                style={{ height: `${(r.total / max) * 100}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: Math.min(i, 20) * 0.03 }}
              >
                {r.social > 0 && (
                  <div
                    className="w-full rounded-t-[4px]"
                    style={{ flexGrow: r.social, backgroundColor: SOCIAL_COLOR }}
                  />
                )}
                {r.juegos > 0 && (
                  <div
                    className={cn("w-full", r.social === 0 && "rounded-t-[4px]")}
                    style={{ flexGrow: r.juegos, backgroundColor: JUEGOS_COLOR }}
                  />
                )}
              </motion.div>
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-xs font-bold text-muted-foreground">
        <span>{formatDate(rows[0].fecha).slice(0, 6)}</span>
        {rows.length > 1 && <span>{formatDate(rows[rows.length - 1].fecha).slice(0, 6)}</span>}
      </div>

      {/* Readout of the selected activity (the latest by default) */}
      <div className="mt-4 border-t border-border pt-4" aria-live="polite">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-foreground">
              {selected.titulo || "Actividad"}
            </div>
            <div className="text-xs font-bold text-muted-foreground">{formatDate(selected.fecha)}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xl font-black leading-none tabular-nums text-foreground">{selected.total}</div>
            <div className="mt-1 text-xs font-bold text-muted-foreground">presentes</div>
          </div>
        </div>
        <SplitBar
          segments={[
            { key: "juegos", value: selected.juegos, color: JUEGOS_COLOR },
            { key: "social", value: selected.social, color: SOCIAL_COLOR },
          ]}
        />
        <div className="mt-2 flex justify-between text-sm font-bold text-foreground">
          <span>
            Juegos {selected.juegos}{" "}
            <span className="text-muted-foreground">· {percent(selected.juegos, selected.total)}%</span>
          </span>
          <span>
            Social {selected.social}{" "}
            <span className="text-muted-foreground">· {percent(selected.social, selected.total)}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Legend({ juegos, social }: { juegos: number; social: number }) {
  return (
    <div className="flex gap-3 text-xs font-bold text-muted-foreground">
      {[
        { label: "Juegos", value: juegos, color: JUEGOS_COLOR },
        { label: "Social", value: social, color: SOCIAL_COLOR },
      ].map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: item.color }} aria-hidden="true" />
          {item.label} {item.value}%
        </span>
      ))}
    </div>
  );
}
