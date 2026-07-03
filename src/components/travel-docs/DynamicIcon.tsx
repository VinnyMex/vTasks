import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function DynamicIcon({ name, className = "w-5 h-5", size }: DynamicIconProps) {
  // Get icon by string name. Default to HelpCircle if not found.
  const LucideIcon = (Icons as any)[name];
  
  if (!LucideIcon) {
    return <Icons.HelpCircle className={className} size={size} />;
  }
  
  return <LucideIcon className={className} size={size} />;
}
