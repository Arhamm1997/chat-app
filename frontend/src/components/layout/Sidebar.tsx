// src/components/layout/Sidebar.tsx
'use client';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  children: ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  side?: 'left' | 'right';
  className?: string;
}

export function Sidebar({ 
  children, 
  isOpen = true, 
  onClose, 
  side = 'right',
  className 
}: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && onClose && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          'fixed md:relative inset-y-0 z-50 flex flex-col w-80 max-w-[90vw] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out md:transform-none md:transition-none',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          isOpen ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full',
          'md:translate-x-0',
          className
        )}
      >
        {children}
      </div>
    </>
  );
}