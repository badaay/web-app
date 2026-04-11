import { createClient } from '@supabase/supabase-js'

const supabaseUrlA = import.meta.env.VITE_SUPABASE_URL_A || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKeyA = import.meta.env.VITE_SUPABASE_ANON_KEY_A || import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrlB = import.meta.env.VITE_SUPABASE_URL_B;
const supabaseAnonKeyB = import.meta.env.VITE_SUPABASE_ANON_KEY_B;

// Client-side Supabase (Auth + RLS-protected queries only)
export const supabase = createClient(supabaseUrlA, supabaseAnonKeyA); // Default (Project A / Core)
export const supabaseA = supabase;
export const supabaseB = supabaseUrlB ? createClient(supabaseUrlB, supabaseAnonKeyB) : null;

// REMOVED: supabaseAdmin - now handled by /api/* routes (server-side only)
// Service Role Key is no longer exposed to the browser

/**
 * Helper to get a viewable URL for a storage item.
 * @param {string} pathOrUrl - The path or URL stored in the DB.
 * @param {string} bucket - The bucket name.
 * @param {boolean} isPrivate - Whether the bucket is private.
 * @returns {Promise<string>}
 */
export async function getStorageUrl(pathOrUrl, bucket = 'house_photos', isPrivate = false) {
    if (!pathOrUrl) return '';
    if (pathOrUrl.startsWith('http')) return pathOrUrl;
    if (pathOrUrl.startsWith('data:image')) return pathOrUrl; // Base64 fallback

    const client = isPrivate ? supabaseA : supabaseB;
    if (!client || !client.storage) return pathOrUrl;

    try {
        if (isPrivate) {
            const { data, error } = await client.storage.from(bucket).createSignedUrl(pathOrUrl, 3600);
            if (error) throw error;
            return data.signedUrl;
        } else {
            const { data: { publicUrl } } = client.storage.from(bucket).getPublicUrl(pathOrUrl);
            return publicUrl;
        }
    } catch (err) {
        console.error(`[getStorageUrl] Error for ${pathOrUrl}:`, err);
        return '';
    }
}

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
