import { supabaseAdmin, supabase, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return errorResponse('Phone and password are required', 400);
    }

    // Lookup customer by phone to get their email
    const { data: customer, error: dbError } = await supabaseAdmin
      .from('customers')
      .select('email, id')
      .eq('phone', phone)
      .maybeSingle();

    if (dbError || !customer || !customer.email) {
      return errorResponse('Invalid phone number or password', 401);
    }

    // Login using Supabase Auth with the mapped email
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: customer.email,
      password: password,
    });

    if (authError || !data.session) {
      return errorResponse('Invalid phone number or password', 401);
    }

    // Return the session tokens so the client can set it
    return jsonResponse({
      success: true,
      session: data.session,
      user: data.user
    }, 200);

  } catch (error) {
    console.error('Customer login error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
