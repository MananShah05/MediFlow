import React from "react";
import { cn } from "@/lib/utils";

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function LogoIcon({ className, size = 28, ...props }: LogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={cn("shrink-0", className)}
      {...props}
    >
      {/* Rounded dark background for the icon */}
      <rect width="32" height="32" rx="7" fill="#0B0F19" />
      
      <defs>
        {/* Cyan to Blue gradient for the medical flow effect */}
        <linearGradient id="mf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F2FE" />
          <stop offset="100%" stopColor="#4FACFE" />
        </linearGradient>
      </defs>

      {/* M shape styled as a vital/flow wave */}
      <path
        d="M6 22V10L11 16L16 10V22"
        stroke="url(#mf-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* F shape integrated alongside */}
      <path
        d="M20 22V10H26M20 16H24"
        stroke="#00F2FE"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
