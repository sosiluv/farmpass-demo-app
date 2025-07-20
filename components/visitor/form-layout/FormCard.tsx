import React from "react";
import { Card } from "@/components/ui/card";

interface FormCardProps {
  children: React.ReactNode;
  className?: string;
}

export const FormCard = ({ children, className = "" }: FormCardProps) => {
  return (
    <Card
      className={`shadow-lg rounded-lg sm:rounded-2xl border border-gray-100 bg-white/95 max-w-lg mx-auto ${className}`}
    >
      {children}
    </Card>
  );
};
