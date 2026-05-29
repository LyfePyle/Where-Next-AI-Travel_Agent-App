import * as React from "react";
import { cn } from "./utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "flat";
  padding?: "sm" | "md" | "lg";
}

/**
 * Card component with Golden Ratio spacing
 * - Consistent padding using Golden Ratio progression
 * - Equal heights for symmetry
 * - Purple-themed hover effects
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", children, ...props }, ref) => {
    const baseClasses = "bg-white rounded-3xl transition-all duration-300 hover:scale-[1.02] flex flex-col";
    
    const variantClasses = {
      default: "shadow-lg hover:shadow-xl",
      elevated: "shadow-xl hover:shadow-2xl",
      flat: "shadow-sm hover:shadow-md"
    };
    
    const paddingClasses = {
      sm: "p-6 lg:p-8",
      md: "p-8 lg:p-10 xl:p-12", // Golden Ratio progression
      lg: "p-10 lg:p-12 xl:p-16"
    };
    
    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], paddingClasses[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
