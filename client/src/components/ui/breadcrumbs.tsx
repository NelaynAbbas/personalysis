import React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs component for navigation
 * Shows the current path with links to previous pages
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-4", className)}>
      <ol className="flex items-center flex-wrap space-x-1 text-sm text-muted-foreground">
        <li key="home" className="flex items-center">
          <Link to="/" className="flex items-center hover:text-primary focus:outline-none focus:underline focus:text-primary transition-colors">
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Component = isLast ? "span" : Link;
          
          return (
            <React.Fragment key={item.label}>
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
              </li>
              <li className="flex items-center">
                {item.href && !isLast ? (
                  <Link
                    to={item.href}
                    className="flex items-center hover:text-primary focus:outline-none focus:underline focus:text-primary transition-colors"
                  >
                    {item.icon && <span className="mr-1">{item.icon}</span>}
                    {item.label}
                  </Link>
                ) : (
                  <span 
                    className={cn(
                      "flex items-center",
                      isLast && "font-medium text-foreground"
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.icon && <span className="mr-1">{item.icon}</span>}
                    {item.label}
                  </span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}