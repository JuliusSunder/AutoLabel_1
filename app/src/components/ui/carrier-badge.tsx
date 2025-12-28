import * as React from "react"
import { Badge } from "./badge"
import { cn } from "@/lib/utils"

/**
 * Carrier-specific badge colors based on official brand colors
 */

const carrierColors = {
  DPD: {
    bg: "bg-[#DC0032]", // DPD Rot
    text: "text-white",
    border: "border-[#DC0032]",
  },
  HERMES: {
    bg: "bg-[#00A0E3]", // Hermes Hellblau
    text: "text-white",
    border: "border-[#00A0E3]",
  },
  GLS: {
    bg: "bg-[#003781]", // GLS Dunkelblau
    text: "text-white",
    border: "border-[#003781]",
  },
  DHL: {
    bg: "bg-[#FFCC00]", // DHL Gelb
    text: "text-black",
    border: "border-[#FFCC00]",
  },
  UPS: {
    bg: "bg-[#FFB500]", // UPS Gold
    text: "text-black",
    border: "border-[#FFB500]",
  },
} as const

type CarrierName = keyof typeof carrierColors

interface CarrierBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  carrier: string
}

export function CarrierBadge({ carrier, className, ...props }: CarrierBadgeProps) {
  // Normalize carrier name
  const normalizedCarrier = carrier.toUpperCase().trim() as CarrierName
  
  // Get colors or use default
  const colors = carrierColors[normalizedCarrier as CarrierName]
  
  if (!colors) {
    // Default fallback for unknown carriers
    return (
      <Badge variant="secondary" className={className} {...props}>
        {carrier}
      </Badge>
    )
  }
  
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
      {...props}
    >
      {carrier}
    </div>
  )
}

interface PlatformBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  platform: string
}

export function PlatformBadge({ platform, className, ...props }: PlatformBadgeProps) {
  // Check if it's Vinted
  const isVinted = platform.toLowerCase().includes('vinted') || 
                   platform.toLowerCase().includes('kleiderkreisel')
  
  if (isVinted) {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
          "bg-[#007782] text-white border-[#007782]", // Vinted Teal
          className
        )}
        {...props}
      >
        Vinted
      </div>
    )
  }
  
  // Default for other platforms
  return (
    <Badge variant="secondary" className={className} {...props}>
      {platform}
    </Badge>
  )
}

