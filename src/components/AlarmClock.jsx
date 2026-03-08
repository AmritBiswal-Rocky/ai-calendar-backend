import { useState } from 'react';
import { useEvents } from '@/context/EventContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AlarmClock({ selectedDate, eventDate }) {
  const { alarms = [], addAlarm, deleteAlarm } = useEvents();
  const [time, setTime] = useState('');

  // Normalize date string: prefer selectedDate (Date) if provided
  const eventDateStr =
    eventDate ?? (selectedDate ? new Date(selectedDate).toDateString() : undefined);

  const handleAdd = () => {
    if (!time || !eventDateStr) return;
    addAlarm({ id: Date.now().toString(), time, eventDate: eventDateStr });
    setTime('');
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">
        Alarm Clock{eventDateStr ? ` — ${eventDateStr}` : ''}
      </h2>

      <div className="flex items-center gap-2 mb-4">
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-32"
        />
        <Button onClick={handleAdd}>Add</Button>
      </div>

      {alarms.length === 0 ? (
        <p className="text-sm text-muted-foreground">No alarms set</p>
      ) : (
        <ul className="space-y-2">
          {alarms.map((alarm) => (
            <li key={alarm.id} className="flex items-center justify-between p-2 rounded bg-muted">
              <span>{alarm.time}</span>
              <Button variant="destructive" size="sm" onClick={() => deleteAlarm(alarm.id)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
