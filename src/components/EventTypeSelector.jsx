// src/components/EventTypeSelector.jsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, CheckSquare, Briefcase, Ban, Folder } from 'lucide-react';

const OPTIONS = [
  { label: 'Create Event', value: 'event', icon: CalendarIcon },
  { label: 'Task', value: 'task', icon: CheckSquare },
  { label: 'Working Location', value: 'location', icon: Briefcase },
  { label: 'Out of Office', value: 'ooo', icon: Ban },
  { label: 'Project', value: 'project', icon: Folder },
];

export default function EventTypeSelector({ open, onClose, onSelect }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What would you like to create?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          {OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant="outline"
              className="flex flex-col gap-2 p-6 rounded-xl shadow hover:scale-105 transition items-center"
              onClick={() => onSelect?.(opt.value)}
            >
              <opt.icon className="w-6 h-6" />
              <span className="text-sm">{opt.label}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
