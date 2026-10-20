"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Plus, Copy, Zap } from "lucide-react";
import { SUPABASE_DEFAULT_AVATAR } from "@/lib/supabase";

interface ComponentProps {
  name?: string;
  role?: string;
  email?: string;
  avatarSrc?: string;
  statusText?: string;
  statusColor?: string; 
  glowText?: string; 
  className?: string;
}

export default function Component({
  name = "Mesum Raza",
  role = "Founder & CEO | Avtive",
  email = "mesum@avtive.app",
  avatarSrc = SUPABASE_DEFAULT_AVATAR,
  statusText = "Available for Enterprise Demos",
  statusColor = "bg-green-500",
  glowText = "Avtive Smart NFC Identity",
  className,
}: ComponentProps) {
  const [copied, setCopied] = useState(false);

  // Derive a local clock text once per minute
  const timeText = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, "0");
    const hour12 = ((h + 11) % 12) + 1;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${hour12}:${m}${ampm}`;
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("relative w-full max-w-sm mx-auto", className)}
    >
      <div className="pointer-events-none absolute inset-x-3 -bottom-10 top-[90%] rounded-[28px] bg-green-400/80 blur-0 shadow-[0_40px_80px_-16px_rgba(34,197,94,0.6)] z-0" />

      <div className="absolute inset-x-0 -bottom-10 mx-auto w-full z-0">
        <div className="flex items-center justify-center gap-2 bg-transparent py-3 text-center text-sm font-medium text-black">
          <Zap className="h-4 w-4 text-green-600" /> {glowText}
        </div>
      </div>

      <Card className={cn(
        "relative z-10 mx-auto w-full max-w-3xl overflow-visible rounded-[24px]",
        "bg-white/90 dark:bg-white/10 backdrop-blur-xl",
        "border border-slate-200/90 dark:border-white/10",
        "shadow-xl shadow-slate-200/50 dark:shadow-black/20 text-slate-900 dark:text-white"
      )}>
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <span className={cn("inline-block h-2.5 w-2.5 rounded-full animate-pulse", statusColor)} />
              <span className="select-none text-xs font-semibold text-slate-700 dark:text-slate-300">{statusText}</span>
            </div>
            <div className="flex items-center gap-2 opacity-80 text-xs">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="tabular-nums font-mono">{timeText}</span>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center gap-4">
            <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-[24px] ring-2 ring-slate-200/80 dark:ring-white/10 shadow-lg">
              <Image
                src={avatarSrc}
                alt={`${name} avatar`}
                fill
                sizes="(max-width: 768px) 192px, 192px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 text-center space-y-0.5">
              <h3 className="truncate text-xl font-bold tracking-tight sm:text-2xl text-slate-900 dark:text-white">
                {name}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">{role}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-11 justify-start gap-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-white/10 dark:hover:bg-white/20 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold shadow-xs"
            >
              <Plus className="h-4 w-4 text-green-600" /> Hire Me
            </Button>

            <Button
              variant="outline"
              onClick={handleCopy}
              className="h-11 justify-start gap-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-white/10 dark:hover:bg-white/20 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold shadow-xs"
            >
              <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy Email"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
