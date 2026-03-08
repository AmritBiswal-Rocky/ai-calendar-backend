// src/components/modals/ChooseTypeModal.jsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, CheckSquare, MapPin, CalendarX2, FolderClosed, CalendarPlus } from 'lucide-react';

export default function ChooseTypeModal({ isOpen, onClose, onChoose }) {
  const options = [
    {
      key: 'event',
      label: 'Create Event',
      className: 'bg-blue-600 hover:bg-blue-700 text-white',
      Icon: Plus,
    },
    {
      key: 'task',
      label: 'Task',
      className: 'bg-green-600 hover:bg-green-700 text-white',
      Icon: CheckSquare,
    },
    {
      key: 'project',
      label: 'Project',
      className: 'bg-slate-600 hover:bg-slate-700 text-white',
      Icon: FolderClosed,
    },
    {
      key: 'appointment',
      label: 'Appointment',
      className: 'bg-teal-600 hover:bg-teal-700 text-white',
      Icon: CalendarPlus,
    },
    {
      key: 'working',
      label: 'Working Location',
      className: 'bg-purple-600 hover:bg-purple-700 text-white',
      Icon: MapPin,
    },
    {
      key: 'outofoffice',
      label: 'Out of Office',
      className: 'bg-red-600 hover:bg-red-700 text-white',
      Icon: CalendarX2,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">What would you like to create?</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {options.map((opt) => {
            const Ico = opt.Icon;
            return (
              <Button
                key={opt.key}
                className={`w-full justify-center rounded-lg ${opt.className}`}
                onClick={() => onChoose?.(opt.key)}
              >
                <span className="flex items-center gap-2">
                  <Ico className="h-4 w-4" />
                  {opt.label}
                </span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
