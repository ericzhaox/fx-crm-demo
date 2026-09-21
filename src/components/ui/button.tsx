import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger" | "ghost";
  size?: "sm" | "md";
}

export function Button({ className, variant = "default", size = "md", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "min-h-8 px-2.5 py-1 text-xs" : "min-h-9 px-3 py-1.5 text-sm",
        variant === "primary" && "border-primary bg-primary text-white hover:bg-primary-dark",
        variant === "default" && size === "sm" && "border-primary bg-blue-50 text-primary hover:bg-blue-100",
        variant === "default" && size !== "sm" && "border-border bg-surface text-text hover:border-slate-300 hover:bg-slate-50",
        variant === "danger" && "border-red-200 bg-surface text-danger hover:bg-red-50",
        variant === "ghost" && "border-transparent text-muted hover:bg-slate-100 hover:text-text",
        className
      )}
      {...props}
    />
  );
}
