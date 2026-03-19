import { supabase, supabaseAdmin } from './supabase.js';
import { APP_CONFIG } from './config.js';

/**
 * Generate a random 8-character alphanumeric password
 * @returns {string}
 */
export const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

/**
 * Generate a Customer Code in the format YYMM + 7 random digits
 * @returns {string}
 */
export const generateCustomerCode = () => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const randomSegment = Math.floor(1000 + Math.random() * 9000); // 4 digits
    return `${year}${month}${randomSegment}`;
};

/**
 * Register a new customer in Supabase Auth and the customers table
 * @param {string} id - The Employee ID or Customer ID used as login
 * @param {string} password 
 * @param {string} customerCode 
 * @param {string} contactEmail - Optional contact email
 * @returns {Promise<{user: any, error: any}>}
 */
export async function adminCreateCustomer(id, password, customerCode, contactEmail = null) {
    if (!supabaseAdmin) {
        throw new Error("Supabase Admin client is not initialized. Check your Service Role Key.");
    }

    // Create a ghost email for Supabase Auth since it requires an email
    const ghostEmail = `${id}${APP_CONFIG.AUTH_DOMAIN_SUFFIX}`;

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: ghostEmail,
        password: password,
        email_confirm: true,
        user_metadata: { 
            role: 'customer', 
            customer_code: customerCode,
            employee_id: id
        }
    });

    if (authError) throw authError;

    // 2. Insert into the customers table
    const { error: dbError } = await supabaseAdmin
        .from('customers')
        .insert([
            {
                id: authData.user.id,
                name: id, // Default name from ID
                address: 'Alamat belum diatur', // Default address
                customer_code: customerCode,
                email: contactEmail || ghostEmail // Store contact email if provided, fallback to ghost
            }
        ]);

    if (dbError) {
        // Rollback: try to delete the auth user if DB insert fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw dbError;
    }

    return { user: authData.user, customerCode };
}

/**
 * Reset a user's password using Supabase Admin API
 * @param {string} userId 
 * @param {string} newPassword 
 * @returns {Promise<any>}
 */
export async function adminResetPassword(userId, newPassword) {
    if (!supabaseAdmin) {
        throw new Error("Supabase Admin client is not initialized.");
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
    );

    if (error) throw error;
    return data;
}
