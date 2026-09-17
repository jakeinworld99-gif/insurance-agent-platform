import { createServerClient } from '@supabase/ssr'
import { createClient as createSbClient } from '@supabase/supabase-js'
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
 * Service-role client (bypasses RLS). Use only on the server, only when the
 * caller already trusts the input by some other means (UUID in URL, signed
 * token, etc.). Never expose to the browser.
 *
 * Currently used by the public PDF route, where the proposal UUID is the
 * bearer: any visitor with the URL can render the demo proposal. Demo data
 * only.
 */
export function createServiceClient(): SupabaseClient {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
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