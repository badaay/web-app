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
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Guard: Prevent mutation without session
        const isMutation = ['POST', 'PATCH', 'DELETE', 'PUT'].includes(options.method?.toUpperCase());
        if (isMutation && !session) {
            throw new Error('Unauthorized: Session required for data mutation');
        }

        // Ensure path starts with / and doesn't double /api
        const path = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        
        console.log(`[API] calling ${path}...`);

        const response = await fetch(path, {
            headers: {
                'Content-Type': 'application/json',
                ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json().catch(() => ({ error: 'Invalid JSON response from server' }));
        
        if (!response.ok) {
            console.error(`[API] error ${response.status} for ${path}:`, data.error || data);
            throw new Error(data.error || `API call failed with status ${response.status}`);
        }
        
        return data;
    } catch (err) {
        console.error(`[API] catch for ${endpoint}:`, err);
        throw err;
    }
}
