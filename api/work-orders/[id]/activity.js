// Work Order Activity API Endpoint
// Handles real-time activity feed for work orders

import { withCors } from '../../_lib/supabase.js';

export async function handler(request, context) {
  const url = new URL(request.url);
  const { id } = context.params;
  const method = request.method;

  try {
    switch (method) {
      case 'GET':
        return handleGet(request, url, id);
      case 'POST':
        return handlePost(request, url, id);
      default:
        return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    console.error('Work order activity API error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle GET requests - fetch activity feed
async function handleGet(request, url, workOrderId) {
  const { searchParams } = url;
  const since = searchParams.get('since');
  const limit = parseInt(searchParams.get('limit')) || 50;
  const offset = parseInt(searchParams.get('offset')) || 0;
  const activityType = searchParams.get('type');

  try {
    // Build query
    let query = supabase
      .from('work_order_activity')
      .select(`
        *,
        employees(name, phone),
        work_orders(id, title, status)
      `)
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add filters
    if (since) {
      query = query.gte('created_at', since);
    }
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    const { data: activities, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('work_order_activity')
      .select('*', { count: 'exact', head: true })
      .eq('work_order_id', workOrderId);

    return new Response(JSON.stringify({
      success: true,
      data: activities,
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching work order activity:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle POST requests - create new activity
async function handlePost(request, url, workOrderId) {
  const body = await request.json();
  const { activity_type, activity_data, metadata = {} } = body;

  if (!activity_type) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing required field: activity_type'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get user info from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      request.headers.get('Authorization')?.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create activity record
    const { data: activity, error } = await supabase
      .from('work_order_activity')
      .insert({
        work_order_id: workOrderId,
        technician_id: user.user_metadata?.technician_id || user.id,
        activity_type,
        activity_data,
        metadata: {
          ...metadata,
          user_agent: request.headers.get('User-Agent'),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Update work order status cache
    await updateWorkOrderStatusCache(workOrderId);

    // Broadcast to WebSocket clients
    await broadcastActivityUpdate(activity);

    return new Response(JSON.stringify({
      success: true,
      data: activity
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating work order activity:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Update work order status cache
async function updateWorkOrderStatusCache(workOrderId) {
  try {
    const { data: latestActivity } = await supabase
      .from('work_order_activity')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestActivity) {
      await supabase
        .from('work_order_status_cache')
        .upsert({
          work_order_id,
          last_activity_at: latestActivity.created_at,
          updated_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error updating status cache:', error);
  }
}

// Broadcast activity update to WebSocket clients
async function broadcastActivityUpdate(activity) {
  try {
    // This would connect to your WebSocket server
    // For now, we'll just log the activity
    console.log('Broadcasting activity update:', activity);
    
    // In a real implementation, you would:
    // 1. Connect to WebSocket server
    // 2. Send message to relevant clients
    // 3. Handle connection errors
    
  } catch (error) {
    console.error('Error broadcasting activity update:', error);
  }
}

export const config = {
  runtime: 'edge'
};

export default withCors(handler);
