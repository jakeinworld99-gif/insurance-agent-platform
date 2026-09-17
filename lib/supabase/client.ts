import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createClient(): SupabaseClient {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Resolves public.agents.id for the currently signed-in user in the browser.
 * customers.agent_id references public.agents.id, not auth.users.id.
 * Returns null if no user is signed in or no agent row exists.
 */
export async function getAgentId(supabase: SupabaseClient): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single()
  return data?.id ?? null
}