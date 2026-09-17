import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

/**
 * Resolves public.agents.id for the currently signed-in user.
 * Returns null if no user is signed in or no agent row exists.
 *
 * customers.agent_id, proposals.agent_id, policies.agent_id all reference
 * public.agents.id (not auth.users.id). The agent row is created by the
 * handle_new_user trigger on signup, so this should always succeed for a
 * signed-in user. Callers MUST treat null as a 401/403.
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