/**
 * POST /api/admin/create-user
 * 
 * Creates a new user in Supabase Auth and optionally in customers/employees table.
 * This endpoint uses the Service Role Key and should only be called by admins.
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "securepassword",
 *   "metadata": { "role": "customer", "customer_code": "..." },
 *   "customerData": { ... } // Optional: insert into customers table
 *   "employeeData": { ... } // Optional: insert into employees table
 * }
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Verify the requester is authenticated and is an admin
    const { user, error: authError } = await verifyAuth(req);
    
    if (authError) {
      return errorResponse(authError, 401);
    }

    const isUserAdmin = await isAdmin(user.id);
    if (!isUserAdmin) {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    // Parse request body
    const { email, password, metadata = {}, customerData, employeeData } = await req.json();

    // Validate required fields
    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400);
    }

    // Create user in Supabase Auth
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: metadata
    });

    if (createError) {
      return errorResponse(`Auth error: ${createError.message}`, 400);
    }

    const userId = authData.user.id;

    // Insert into customers table if customerData provided
    if (customerData) {
      const { error: dbError } = await supabaseAdmin
        .from('customers')
        .insert([{
          ...customerData,
          id: userId // Link to auth user
        }]);

      if (dbError) {
        // Rollback: delete the auth user
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return errorResponse(`Database error: ${dbError.message}`, 500);
      }
    }

    // Insert into employees table if employeeData provided
    if (employeeData) {
      const { error: dbError } = await supabaseAdmin
        .from('employees')
        .insert([{
          ...employeeData,
          id: userId,
          email: email
        }]);

      if (dbError) {
        // Rollback: delete the auth user
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return errorResponse(`Database error: ${dbError.message}`, 500);
      }
    }

    return jsonResponse({
      success: true,
      user: {
        id: userId,
        email: authData.user.email,
        created_at: authData.user.created_at
      }
    }, 201);

  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
