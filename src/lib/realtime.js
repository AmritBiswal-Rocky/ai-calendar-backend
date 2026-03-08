// src/lib/realtime.js
// Supabase Realtime subscriptions for tasks and notes
// Uses Supabase JS v2 channel API (works with RLS; only emits rows the user can access)

import supabase from './supabaseClient';

// Generic helper to subscribe to a table's changes
function subscribeToTable(table, callback, channelName = `realtime-${table}`) {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => {
        // payload.eventType: 'INSERT' | 'UPDATE' | 'DELETE'
        // payload.new: the new row
        // payload.old: the old row (for UPDATE/DELETE)
        callback?.(payload);
      }
    )
    .subscribe();

  return channel; // pass this to removeRealtimeSubscription(channel)
}

// Subscribe to changes in tasks for the current user
export function subscribeTasks(callback) {
  return subscribeToTable('tasks', callback, 'realtime-tasks');
}

// Subscribe to changes in notes for the current user
export function subscribeNotes(callback) {
  return subscribeToTable('notes', callback, 'realtime-notes');
}

// Cleanup helper compatible with Supabase JS v2
export function removeRealtimeSubscription(channel) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}

// Example usage in a component:
// const taskChannel = subscribeTasks(handleTaskChange);
// const noteChannel = subscribeNotes(handleNoteChange);
// ... on cleanup:
// removeRealtimeSubscription(taskChannel);
// removeRealtimeSubscription(noteChannel);
