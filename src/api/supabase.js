import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key'

// Client-side Supabase (Auth + RLS-protected queries only)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// REMOVED: supabaseAdmin - now handled by /api/* routes (server-side only)
// Service Role Key is no longer exposed to the browser

/**
 * Helper to call Vercel API endpoints
 * @param {string} endpoint - API path (e.g., '/admin/create-user')
 * @param {object} options - Fetch options
 * @returns {Promise<any>}
 */
export async function apiCall(endpoint, options = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`/api${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
            ...options.headers
        },
        ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'API call failed');
    }
    
    return data;
}
