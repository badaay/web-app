/**
 * Point Service — Business logic for point distribution and payroll adjustments
 */
import * as pointRepo from '../repositories/point.repository.js';

/**
 * Distribute points from a completed Work Order to all assigned technicians
 * DEPRECATED: Distribution is now handled by database trigger trg_work_order_closed.
 * Use this only if manual redistribution is required.
 */
export async function distributeWorkOrderPoints(dbClient, workOrderId) {
  try {
    // Calling the optimized Postgres function instead of looping in JS
    const { error } = await dbClient.rpc('distribute_work_order_points', {
      p_work_order_id: workOrderId
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error distributing points:', error);
    return { success: false, error, statusHint: 'server_error' };
  }
}

/**
 * Calculate all point-related salary adjustments for an employee's monthly payroll
 * Optimised version: Uses set-based RPC for better performance (P1 Best Practice)
 */
export async function calculateMonthlyAdjustments(dbClient, employeeId, month, year) {
  try {
    // Single database call to get all adjustments for this employee
    const { data, error } = await dbClient.rpc('calculate_all_payroll_adjustments', {
      p_month: month,
      p_year: year
    });

    if (error) throw error;

    // Filter for specific employee and map to required format
    const adjustments = (data || [])
      .filter(adj => adj.employee_id === employeeId)
      .map(adj => ({
        type: adj.adjustment_type === 'addition' ? 'performance_bonus' : adj.component_code.toLowerCase(),
        amount: adj.amount,
        details: adj.details
      }));

    return { success: true, data: adjustments };
  } catch (error) {
    console.error('Error calculating adjustments:', error);
    return { success: false, error, statusHint: 'server_error' };
  }
}

/**
 * Get aggregated metrics for the payroll summary
 */
export async function getPayrollMetrics(dbClient, month, year) {
  try {
    const { data, error } = await dbClient
      .from('v_payroll_ready_metrics')
      .select('*')
      .eq('month', month)
      .eq('year', year);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching payroll metrics:', error);
    return { success: false, error };
  }
}
