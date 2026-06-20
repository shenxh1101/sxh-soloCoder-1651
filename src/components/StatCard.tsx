import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ColorScheme = "orange" | "green" | "red" | "blue";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  colorScheme?: ColorScheme;
}

const gradientMap: Record<ColorScheme, string> = {
  orange: "from-orange-400 to-orange-600",
  green: "from-green-400 to-green-600",
  red: "from-red-400 to-red-600",
  blue: "from-blue-400 to-blue-600",
};

const iconBgMap: Record<ColorScheme, string> = {
  orange: "bg-orange-500/20",
  green: "bg-green-500/20",
  red: "bg-red-500/20",
  blue: "bg-blue-500/20",
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  colorScheme = "orange",
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg",
        gradientMap[colorScheme]
      )}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </div>
          <div className={cn("rounded-xl p-3", iconBgMap[colorScheme])}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-4 flex items-center gap-1 text-sm">
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="font-medium">
              {isPositive ? "+" : ""}
              {trend}%
            </span>
            <span className="text-white/70">较上周</span>
          </div>
        )}
      </div>
      <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
    </div>
  );
}
