"use client";

import Link from "next/link";
import { MotionConfig } from "framer-motion";
import { ChevronRight, Trophy } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { Skeleton } from "@/components/ui/skeleton";
import { CountUp, Reveal } from "@/app/_components/home-ui";
import { AttendanceChart } from "@/app/_components/AttendanceChart";
import { cn, formatDate, getTodayDateString } from "@/lib/utils";
import type { Activity } from "@/lib/types";

const cardLinkClass =
  "block rounded-3xl border border-border bg-card transition-colors hover:bg-muted/50 active:bg-muted";

export default function Page() {
  const { db, isLoading } = useApp();
  const { participants, activities } = db;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-16 rounded-3xl" />
      </div>
    );
  }

  // From 00:00 (device time) an activity dated today is the current one; future ones are left out
  const today = getTodayDateString();
  const held = (activities || []).filter((a) => a.fecha <= today);
  const current = held.reduce<Activity | null>(
    (latest, a) => (!latest || a.fecha > latest.fecha ? a : latest),
    null,
  );
  const totalGoles = (activities || []).reduce(
    (acc, a) => acc + (a.goles || []).reduce((s, g) => s + g.cant, 0),
    0,
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="p-4">
        {/* Totals */}
        <Reveal index={0} className="mb-8">
          <div className="grid grid-cols-3 divide-x divide-border rounded-3xl border border-border bg-card py-5">
            {[
              { label: "Actividades", value: activities.length },
              { label: "Jugadores", value: (participants || []).length },
              { label: "Total Goles", value: totalGoles },
            ].map((item) => (
              <div key={item.label} className="px-2 text-center">
                <CountUp
                  value={item.value}
                  className="block text-4xl font-black tracking-tight text-foreground"
                />
                <div className="mt-1 text-xs font-bold text-muted-foreground">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {current && (
          <Reveal index={1} className="mb-8">
            <CurrentActivityCard activity={current} isToday={current.fecha === today} />
          </Reveal>
        )}

        <Reveal index={2} className="mb-8">
          <Link href="/podio" className={cn(cardLinkClass, "flex items-center gap-3 px-4 py-4")}>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Trophy className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-black tracking-tight text-foreground">Podio</div>
              <div className="text-xs font-bold text-muted-foreground">
                Goleadores, puntaje e invitaciones
              </div>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
          </Link>
        </Reveal>

        {held.length > 0 && (
          <Reveal index={3} className="mb-8">
            <h2 className="mb-3 text-xl font-black tracking-tight text-foreground">Asistencia</h2>
            <AttendanceChart activities={held} />
          </Reveal>
        )}
      </div>
    </MotionConfig>
  );
}

/** Today's activity (all zeros until data is loaded) or, when there is none today, the latest one. */
function CurrentActivityCard({ activity, isToday }: { activity: Activity; isToday: boolean }) {
  const stats = [
    { label: "Presentes", value: (activity.asistentes || []).length },
    { label: "Puntuales", value: (activity.puntuales || []).length },
    { label: "Biblias", value: (activity.biblias || []).length },
    { label: "Social", value: (activity.socials || []).length },
    { label: "Goles", value: (activity.goles || []).reduce((s, g) => s + g.cant, 0) },
    { label: "Invitados", value: (activity.invitaciones || []).length },
  ];

  return (
    <Link href={`/activities/${activity.id}`} className={cn(cardLinkClass, "p-4")}>
      <div className="mb-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "text-xs font-black uppercase tracking-wide",
              isToday ? "text-primary" : "text-muted-foreground",
            )}
          >
            {isToday ? "Hoy" : "Última actividad"}
          </div>
          <div className="mt-1 truncate text-lg font-black tracking-tight text-foreground">
            {activity.titulo || "Actividad"}
          </div>
          <div className="text-xs font-bold text-muted-foreground">{formatDate(activity.fecha)}</div>
        </div>
        <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-3 gap-y-4">
        {stats.map((item) => (
          <div key={item.label} className="text-center">
            <CountUp
              value={item.value}
              className="block text-2xl font-black tracking-tight text-foreground"
            />
            <div className="mt-0.5 text-xs font-bold text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>
    </Link>
  );
}
