/**
 * POST /api/admin/reset-password
 * 
 * Resets a user's password using the Admin API.
 * Requires admin authentication.
 * 
 * Request Body:
 * {
 *   "userId": "uuid-of-user",
 *   "newPassword": "newsecurepassword"
 * }
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Verify admin access
    const { user, error: authError } = await verifyAuth(req);
    
    if (authError) {
      return errorResponse(authError, 401);
    }

    const isUserAdmin = await isAdmin(user.id);
    if (!isUserAdmin) {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    // Parse request body
    const { userId, newPassword } = await req.json();

    // Validate
    if (!userId || !newPassword) {
      return errorResponse('userId and newPassword are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400);
    }

    // Reset password using Admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      return errorResponse(`Failed to reset password: ${error.message}`, 400);
    }

    return jsonResponse({
      success: true,
      message: 'Password reset successfully',
      userId: data.user.id
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
