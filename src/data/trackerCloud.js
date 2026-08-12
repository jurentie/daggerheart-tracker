import { supabase } from '../lib/supabase'

export async function loadTrackerFromCloud(userId) {
  const { data, error } = await supabase
    .from('tracker_states')
    .select('tracker_data')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error

  return data?.tracker_data ?? null
}

export async function saveTrackerToCloud(userId, tracker) {
  const { error } = await supabase.from('tracker_states').upsert(
    {
      user_id: userId,
      tracker_data: tracker,
    },
    { onConflict: 'user_id' },
  )

  if (error) throw error
}
