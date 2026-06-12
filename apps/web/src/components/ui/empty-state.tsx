import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-bg-surface border border-border rounded-xl shadow-lg max-w-md mx-auto my-8">
      {Icon && (
        <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-bg-subtle text-brand-primary">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mb-6 text-sm text-text-secondary">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
}
