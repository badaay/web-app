import { apiCall } from './supabase.js';
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
 * Generate a Customer Code in the format YYMM + 4 random digits
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
 * Register a new customer via server-side API (secure)
 * @param {string} id - The Employee ID or Customer ID used as login
 * @param {string} password 
 * @param {string} customerCode 
 * @param {string} contactEmail - Optional contact email
 * @returns {Promise<{user: any, customerCode: string}>}
 */
export async function adminCreateCustomer(id, password, customerCode, contactEmail = null) {
    const ghostEmail = `${id}${APP_CONFIG.AUTH_DOMAIN_SUFFIX}`;

    const result = await apiCall('/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({
            email: ghostEmail,
            password,
            metadata: { 
                role: 'customer', 
                customer_code: customerCode,
                employee_id: id
            },
            customerData: {
                name: id,
                address: 'Alamat belum diatur',
                customer_code: customerCode,
                email: contactEmail || ghostEmail
            }
        })
    });

    return { user: result.user, customerCode };
}

/**
 * Reset a user's password via server-side API (secure)
 * @param {string} userId 
 * @param {string} newPassword 
 * @returns {Promise<any>}
 */
export async function adminResetPassword(userId, newPassword) {
    return await apiCall('/admin/reset-password', {
        method: 'POST',
        body: JSON.stringify({ userId, newPassword })
    });
}
