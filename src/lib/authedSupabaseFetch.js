export async function authedSupabaseFetch(endpoint) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    console.error('Supabase REST error:', await res.text());
    throw new Error('Failed to fetch Supabase endpoint');
  }

  return res.json();
}
