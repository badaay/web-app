import { supabase } from './supabase.js';
import { APP_CONFIG } from './config.js';

/**
 * Centralized Auth Service
 * Handles login, registration, and session management via Supabase Auth
 */
export const AuthService = {
    /**
     * Centralized Login
     * Authenticates users via Supabase Auth with standard credentials
     */
    async login(email, password) {
        // Automatically append domain if it's just a customer code / username
        let finalEmail = email;
        if (email && !email.includes('@')) {
            finalEmail = `${email}${APP_CONFIG.AUTH_DOMAIN_SUFFIX}`;
        }

        // Standard Supabase Login
        const result = await supabase.auth.signInWithPassword({ email: finalEmail, password });
        if (!result.error) {
            sessionStorage.removeItem('sb-mock-session');
        }
        return result;
    },

    /**
     * Customer Login using Phone and Password
     * Calls our custom /api/customers/login API route
     */
    async loginCustomerPhone(phone, password) {
        try {
            const response = await fetch('/api/customers/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });
            const data = await response.json();
            
            if (!response.ok) {
                return { error: { message: data.error || 'Login failed' } };
            }

            // Client sets the returned session to Supabase
            const { error: sbError } = await supabase.auth.setSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token
            });

            if (sbError) return { error: sbError };

            return { data: { user: data.user, session: data.session } };
        } catch (err) {
            return { error: err };
        }
    },

    /**
     * Centralized Registration
     */
    async signUp(email, password, metadata = {}) {
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata // user_metadata
            }
        });
    },

    /**
     * Register a Customer with Auth
     */
    async registerCustomer(authEmail, password, customerData, contactEmail = null) {
        // 1. Sign up to Auth
        const { data, error } = await this.signUp(authEmail, password, {
            full_name: customerData.name,
            customer_code: customerData.customer_code,
            role: 'customer'
        });

        if (error) return { data, error };

        // 2. Insert into customers table
        const { data: customer, error: dbError } = await supabase
            .from('customers')
            .insert([{
                ...customerData,
                id: data.user.id, // Sync Auth ID with DB ID
                username: authEmail, // Link by authEmail (CUST_CODE@domain)
                email: contactEmail || authEmail // Populate contact email column
            }])
            .select()
            .single();

        return { data: { ...data, customer }, error: dbError };
    },

    /**
     * Register an Employee with Auth
     */
    async registerEmployee(email, password, employeeData) {
        // 1. Sign up to Auth
        const { data, error } = await this.signUp(email, password, {
            full_name: employeeData.name,
            employee_id: employeeData.employee_id,
            role: 'teknisi'
        });

        if (error) return { data, error };

        // 2. Insert into employees table
        const { data: employee, error: dbError } = await supabase
            .from('employees')
            .insert([{
                ...employeeData,
                id: data.user.id, // Sync Auth ID with DB ID
                email: email // Populate email column
            }])
            .select()
            .single();

        return { data: { ...data, employee }, error: dbError };
    },

    /**
     * Get current authenticated session
     */
    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return { data: { session } };
    },

    /**
     * Handle Bypass login via URL parameters
     * Used for magic links / technician direct access
     */
    async handleBypassParams() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const type = params.get('type');

        if (token && type === 'bypass') {
            try {
                // Decode token (expected format: base64(email:password))
                const decoded = atob(token);
                const [email, password] = decoded.split(':');
                if (email && password) {
                    const { data, error } = await this.login(email, password);
                    if (!error) {
                        // Clean up URL
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, newUrl);
                        return data;
                    }
                }
            } catch (e) {
                console.warn('Invalid bypass token');
            }
        }
        return null;
    },

    /**
     * Unified Sign Out
     */
    async logout() {
        return await supabase.auth.signOut();
    }
};
