import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-bg-surface border border-red-500/20 rounded-xl shadow-lg max-w-md mx-auto my-8">
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-500/10 text-red-500">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mb-6 text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="destructive">
          Retry Request
        </Button>
      )}
    </div>
  );
}
