import supabase from './supabaseClient';

export async function getProfile(firebaseUid) {
  if (!firebaseUid) throw new Error('No Firebase firebase_uid provided');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .single();

  if (error) throw error;
  return data;
}
