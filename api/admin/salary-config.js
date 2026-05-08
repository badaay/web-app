/**
 * GET/POST /api/admin/salary-config
 * Manage employee salary configuration (Admin Only)
 */
import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);
  
  const authorized = await isAdmin(user.id);
  if (!authorized) return errorResponse('Admin access required', 403);

  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employee_id');

    if (req.method === 'GET') {
      if (!employeeId) return errorResponse('employee_id required', 400);

      const { data, error } = await supabaseAdmin
        .from('employee_salary_configs')
        .select('*')
        .eq('employee_id', employeeId)
        .order('effective_from', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { 
        id, employee_id, effective_from, 
        base_salary, position_allowance, additional_allowance,
        quota_allowance, education_allowance, transport_meal_allowance,
        field_allowance, communication_allowance, target_monthly_points 
      } = body;

      if (!employee_id) return errorResponse('employee_id required', 400);

      // Update target points and base salary in employee table
      const employeeUpdates = {};
      if (target_monthly_points !== undefined) employeeUpdates.target_monthly_points = target_monthly_points;
      if (base_salary !== undefined) employeeUpdates.base_salary = base_salary;
      
      if (Object.keys(employeeUpdates).length > 0) {
        await supabaseAdmin.from('employees').update(employeeUpdates).eq('id', employee_id);
      }

      const payload = {
        employee_id,
        effective_from: effective_from || new Date().toISOString().split('T')[0],
        position_allowance: position_allowance || 0,
        additional_allowance: additional_allowance || 0,
        quota_allowance: quota_allowance || 0,
        education_allowance: education_allowance || 0,
        transport_meal_allowance: transport_meal_allowance || 0,
        field_allowance: field_allowance || 0,
        communication_allowance: communication_allowance || 0,
        updated_at: new Date().toISOString()
      };

      let result;
      if (id) {
        result = await supabaseAdmin.from('employee_salary_configs').update(payload).eq('id', id).select().single();
      } else {
        result = await supabaseAdmin.from('employee_salary_configs').insert(payload).select().single();
      }

      if (result.error) throw result.error;
      return jsonResponse(result.data);
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export default withCors(handler);
