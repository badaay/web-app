import { supabaseAdmin, verifyAuth, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

// GET /api/dashboard/stats - Returns aggregated dashboard statistics
// Response: { totalCustomers, activeWorkOrders, activeEmployees, totalPackages, workOrdersByStatus, topTechnicians }

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405);

  try {
    const { user, error: authError } = await verifyAuth(req);
    if (authError) return errorResponse(authError, 401);

    const [
      customersRes,
      activeWORes,
      employeesRes,
      packagesRes,
      allWOStatusRes,
      topTechRes,
    ] = await Promise.all([
      supabaseAdmin.from('customers').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'closed'),
      supabaseAdmin
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Aktif'),
      supabaseAdmin
        .from('internet_packages')
        .select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('work_orders')
        .select('status'),
      supabaseAdmin
        .from('v_technician_performance')
        .select('name, total_points')
        .order('total_points', { ascending: false })
        .limit(5),
    ]);

    // Aggregate WO counts by status
    const workOrdersByStatus = { waiting: 0, confirmed: 0, open: 0, closed: 0 };
    for (const { status } of allWOStatusRes.data || []) {
      if (status in workOrdersByStatus) workOrdersByStatus[status]++;
    }

    return jsonResponse(
      {
        totalCustomers: customersRes.count ?? 0,
        activeWorkOrders: activeWORes.count ?? 0,
        activeEmployees: employeesRes.count ?? 0,
        totalPackages: packagesRes.count ?? 0,
        workOrdersByStatus,
        topTechnicians: topTechRes.data ?? [],
      },
      200,
      { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' }
    );
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
