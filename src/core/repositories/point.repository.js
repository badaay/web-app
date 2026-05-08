/**
 * Point Repository — Database access for point and salary rules
 */

/**
 * Update points for a specific work order assignment
 */
export async function updateAssignmentPoints(dbClient, workOrderId, employeeId, points) {
  return await dbClient
    .from('work_order_assignments')
    .update({ points_earned: points })
    .match({ work_order_id: workOrderId, employee_id: employeeId });
}

/**
 * Find active conversion rules by metric type
 */
export async function findRulesByMetric(dbClient, metric) {
  return await dbClient
    .from('point_conversion_rules')
    .select('*')
    .eq('trigger_metric', metric);
}

/**
 * Sum total late minutes for an employee in a specific month/year
 */
export async function sumLateMinutes(dbClient, employeeId, month, year) {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data, error } = await dbClient
    .from('attendance_records')
    .select('late_minutes')
    .eq('employee_id', employeeId)
    .gte('attendance_date', startDate)
    .lte('attendance_date', endDate);

  if (error) return { data: null, error };
  
  const total = data.reduce((acc, curr) => acc + (curr.late_minutes || 0), 0);
  return { data: total, error: null };
}

/**
 * Get employee point target and actual performance
 */
export async function getEmployeePerformance(dbClient, employeeId, month, year) {
  // We can use a join or separate queries. For simplicity in TDD:
  const { data: employee, error: empError } = await dbClient
    .from('employees')
    .select('target_monthly_points')
    .eq('id', employeeId)
    .single();

  if (empError) return { data: null, error: empError };

  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  // Sum points from work_order_assignments
  const { data: assignments, error: assignError } = await dbClient
    .from('work_order_assignments')
    .select('points_earned')
    .eq('employee_id', employeeId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (assignError) return { data: null, error: assignError };

  const actualPoints = assignments.reduce((acc, curr) => acc + (curr.points_earned || 0), 0);

  return {
    data: {
      target_points: employee.target_monthly_points || 0,
      actual_points: actualPoints
    },
    error: null
  };
}
