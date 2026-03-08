import { supabase } from '@/lib/supabaseClient';

export async function deleteCalendarEvent(eventId, currentUser) {
  if (!currentUser?.firebase_uid) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)
    .eq('firebase_uid', currentUser.firebase_uid);

  if (error) throw error;
}
