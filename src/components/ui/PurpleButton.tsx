import * as React from "react";
import { cn } from "./utils";
import Link from "next/link";

interface PurpleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
  href?: string;
  children: React.ReactNode;
}

/**
 * Purple-themed button component with Golden Ratio sizing
 * - All buttons use w-48 h-12 for perfect symmetry
 * - Purple-600 background for consistent theme
 * - Golden Ratio spacing and transitions
 */
export const PurpleButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  PurpleButtonProps
>(({ 
  className, 
  variant = "primary", 
  size = "md",
  asLink = false,
  href,
  children,
  ...props 
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg";
  
  const variantClasses = {
    primary: "bg-purple-600 text-white hover:bg-purple-700",
    secondary: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    outline: "border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
  };
  
  const sizeClasses = {
    sm: "w-36 h-10 px-4 py-2 text-sm",
    md: "w-48 h-12 px-6 py-3 text-base", // Golden Ratio: ~192px width
    lg: "w-56 h-14 px-8 py-4 text-lg"
  };
  
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );
  
  if (asLink && href) {
    return (
      <Link href={href} className={classes} ref={ref as any}>
        {children}
      </Link>
    );
  }
  
  return (
    <button className={classes} ref={ref as any} {...props}>
      {children}
    </button>
  );
});

PurpleButton.displayName = "PurpleButton";










