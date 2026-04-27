// Technician Location API Endpoint
// Handles real-time location tracking for technicians

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
      case 'DELETE':
        return handleDelete(request, url, id);
      default:
        return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    console.error('Technician location API error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle GET requests - fetch location history
async function handleGet(request, url, technicianId) {
  const { searchParams } = url;
  const limit = parseInt(searchParams.get('limit')) || 10;
  const offset = parseInt(searchParams.get('offset')) || 0;
  const workOrderId = searchParams.get('work_order_id');
  const since = searchParams.get('since');

  try {
    // Build query
    let query = supabase
      .from('technician_locations')
      .select('*')
      .eq('technician_id', technicianId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add filters
    if (workOrderId) {
      query = query.eq('work_order_id', workOrderId);
    }
    if (since) {
      query = query.gte('timestamp', since);
    }

    const { data: locations, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Get current location (most recent)
    const { data: currentLocation } = await supabase
      .from('technician_locations')
      .select('*')
      .eq('technician_id', technicianId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    return new Response(JSON.stringify({
      success: true,
      data: {
        locations,
        current: currentLocation,
        pagination: {
          limit,
          offset,
          hasMore: locations.length === limit
        }
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching technician location:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle POST requests - update location
async function handlePost(request, url, technicianId) {
  const body = await request.json();
  const { 
    latitude, 
    longitude, 
    accuracy, 
    altitude, 
    altitude_accuracy, 
    heading, 
    speed, 
    location_method = 'gps',
    address,
    work_order_id 
  } = body;

  if (!latitude || !longitude) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing required fields: latitude, longitude'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid coordinates'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // Verify technician ID matches authenticated user
    const userId = user.user_metadata?.technician_id || user.id;
    if (userId !== technicianId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized: Cannot update location for another technician'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create location record
    const { data: location, error } = await supabase
      .from('technician_locations')
      .insert({
        technician_id: technicianId,
        work_order_id: work_order_id || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        altitude: altitude ? parseFloat(altitude) : null,
        altitude_accuracy: altitude_accuracy ? parseFloat(altitude_accuracy) : null,
        heading: heading ? parseFloat(heading) : null,
        speed: speed ? parseFloat(speed) : null,
        location_method,
        address: address || null,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Update work order status cache if associated with work order
    if (work_order_id) {
      await updateWorkOrderLocationCache(work_order_id, location);
    }

    // Broadcast location update to WebSocket clients
    await broadcastLocationUpdate(location);

    return new Response(JSON.stringify({
      success: true,
      data: location
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating technician location:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle DELETE requests - clean up old locations
async function handleDelete(request, url, technicianId) {
  const { searchParams } = url;
  const olderThan = searchParams.get('older_than'); // days
  const workOrderId = searchParams.get('work_order_id');

  try {
    let query = supabase
      .from('technician_locations')
      .delete();

    // Add filters
    query = query.eq('technician_id', technicianId);
    
    if (workOrderId) {
      query = query.eq('work_order_id', workOrderId);
    }
    
    if (olderThan) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));
      query = query.lt('timestamp', cutoffDate.toISOString());
    } else {
      // Default: delete locations older than 30 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      query = query.lt('timestamp', cutoffDate.toISOString());
    }

    const { data, error } = await query.select('count');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      deleted: data.length,
      message: `Deleted ${data.length} location records`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting technician locations:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Update work order location cache
async function updateWorkOrderLocationCache(workOrderId, location) {
  try {
    await supabase
      .from('work_order_status_cache')
      .update({
        location_updates: supabase.raw('location_updates + 1'),
        updated_at: new Date().toISOString()
      })
      .eq('work_order_id', workOrderId);
  } catch (error) {
    console.error('Error updating location cache:', error);
  }
}

// Broadcast location update to WebSocket clients
async function broadcastLocationUpdate(location) {
  try {
    // This would connect to your WebSocket server
    console.log('Broadcasting location update:', location);
    
    // In a real implementation, you would:
    // 1. Connect to WebSocket server
    // 2. Send message to admin clients
    // 3. Handle connection errors
    
  } catch (error) {
    console.error('Error broadcasting location update:', error);
  }
}

export const config = {
  runtime: 'edge'
};

export default withCors(handler);
