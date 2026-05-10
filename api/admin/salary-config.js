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
        id,
        employee_id,
        base_salary,
        target_monthly_points,
        effective_from,
        position_allowance,
        additional_allowance,
        quota_allowance,
        education_allowance,
        transport_meal_allowance,
        field_allowance,
        communication_allowance
      } = body;

      if (!employee_id) return errorResponse('employee_id required', 400);

      // Fetch original employee state for potential rollback
      const { data: originalEmp } = await supabaseAdmin
        .from('employees')
        .select('base_salary, target_monthly_points')
        .eq('id', employee_id)
        .single();

      // 1. Update target points and base salary in employees table
      const employeeUpdates = {};
      if (target_monthly_points !== undefined) employeeUpdates.target_monthly_points = target_monthly_points;
      if (base_salary !== undefined) employeeUpdates.base_salary = base_salary;
      
      let wasEmployeeUpdated = false;
      if (Object.keys(employeeUpdates).length > 0) {
        const { error: empError } = await supabaseAdmin
          .from('employees')
          .update(employeeUpdates)
          .eq('id', employee_id);
        if (empError) {
          console.error('Employee update error:', empError);
          throw new Error('Gagal memperbarui data profil karyawan');
        }
        wasEmployeeUpdated = true;
      }

      // 2. Manage Salary Config (Upsert)
      const payload = {
        employee_id,
        effective_from: (effective_from && effective_from.trim() !== '') ? effective_from : new Date().toISOString().split('T')[0],
        position_allowance: position_allowance || 0,
        additional_allowance: additional_allowance || 0,
        quota_allowance: quota_allowance || 0,
        education_allowance: education_allowance || 0,
        transport_meal_allowance: transport_meal_allowance || 0,
        updated_at: new Date().toISOString()
      };

      if (field_allowance !== undefined) payload.field_allowance = field_allowance || 0;
      if (communication_allowance !== undefined) payload.communication_allowance = communication_allowance || 0;

      let data, upsertError;

      if (id && id.length === 36) {
        // Update existing record
        const { data: d, error: e } = await supabaseAdmin
          .from('employee_salary_configs')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        data = d;
        upsertError = e;
      } else {
        // Insert new record, or update if same date exists
        const { data: d, error: e } = await supabaseAdmin
          .from('employee_salary_configs')
          .upsert(payload, { 
            onConflict: 'employee_id,effective_from',
            ignoreDuplicates: false 
          })
          .select()
          .single();
        data = d;
        upsertError = e;
      }


      if (upsertError) {
        console.error('Salary config upsert error:', upsertError);
        // Compensating Rollback Action
        if (wasEmployeeUpdated && originalEmp) {
          try {
            await supabaseAdmin
              .from('employees')
              .update({ 
                 base_salary: originalEmp.base_salary, 
                 target_monthly_points: originalEmp.target_monthly_points 
              })
              .eq('id', employee_id);
            console.log(`Rolled back employee ${employee_id} due to upsert failure.`);
          } catch (rollbackErr) {
            console.error(`[CRITICAL_DATA_SPLIT] Failed to rollback employee ${employee_id}:`, rollbackErr);
          }
        }
        throw upsertError;
      }
      
      return jsonResponse(data);
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    console.error('API Error:', err);
    // Strict allowlist approach: Hide all raw infrastructure/DB errors from the client
    const isKnownSafeError = err.message === 'employee_id required' || err.message === 'Gagal memperbarui data profil karyawan';
    const safeMessage = isKnownSafeError ? err.message : 'Terjadi kesalahan server saat memproses data. Hubungi administrator.';
    return errorResponse(safeMessage, 500);
  }
}

export default withCors(handler);
