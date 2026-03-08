import { supabase } from '@/lib/supabaseClient';

/**
 * Fetch calendar events for the logged-in Firebase user only
 */
export async function fetchCalendarEvents(currentUser) {
  // ✅ Step 4: Enforce Firebase auth
  if (!currentUser?.firebase_uid) {
    throw new Error('Not authenticated');
  }

  // ✅ Step 3: Filter by firebase_uid
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('firebase_uid', currentUser.firebase_uid)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('❌ Failed to fetch calendar events:', error);
    throw error;
  }

  return data;
}
