import { createClient } from '@supabase/supabase-js'

export default async function handler(request, response) {
  if (request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const { error } = await supabase
    .from('tracker_states')
    .select('user_id', { head: true })
    .limit(1)

  if (error) {
    console.error('Supabase keepalive failed:', error.message)
    return response.status(500).json({ error: 'Supabase request failed' })
  }

  return response.status(200).json({ ok: true })
}
