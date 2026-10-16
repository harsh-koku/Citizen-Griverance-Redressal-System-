"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function Logo({
  size = "md",
  showText = true,
  className = "",
  onClick,
}: LogoProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const dimensions = {
    sm: { icon: 32, text: "text-base", sub: "text-[9px]" },
    md: { icon: 42, text: "text-lg", sub: "text-[10px]" },
    lg: { icon: 68, text: "text-2xl", sub: "text-xs" },
  }[size];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push("/");
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${className}`}
      title={t("Public Grievance Portal")}
    >
      {/* Minimalist Civic AI Logo Emblem */}
      <div className="relative flex-shrink-0">
        <Image
          src="/logo.png"
          alt="IGRS AI Logo"
          width={dimensions.icon}
          height={dimensions.icon}
          className="rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 object-cover aspect-square"
          priority
        />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-slate-900 dark:text-white ${dimensions.text}`}>
              IGRS
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              AI
            </span>
          </div>
          <span className={`font-medium text-gray-500 dark:text-gray-400 hidden sm:inline ${dimensions.sub}`}>
            {t("Public Grievance Portal")}
          </span>
        </div>
      )}
    </div>
  );
}
