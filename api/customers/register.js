import { supabaseAdmin, supabaseAdminB, withCors, jsonResponse, errorResponse, generateCustomerCode } from '../_lib/supabase.js';
import { getTokenConfig, sendWhatsApp } from '../_lib/fonnte.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const body = await req.json();
    const { name, phone, alt_phone, address, packet, lat, lng, photo_ktp, photo_rumah } = body;

    if (!name || !phone || !address) {
      return errorResponse('Name, phone, and address are required', 400);
    }

    // Helper to decode Base64 dataURL
    function base64ToBuffer(dataUrl) {
      const b64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
    }

    let photo_ktp_url = photo_ktp;
    let photo_rumah_url = photo_rumah;
    const fileName = `${phone}_${Date.now()}`;

    // Upload KTP to Project A Core Storage
    if (photo_ktp && photo_ktp.startsWith('data:image')) {
      const buffer = base64ToBuffer(photo_ktp);
      const { data: ktpData, error: ktpErr } = await supabaseAdmin.storage
        .from('ktp_vault')
        .upload(`registrations/${fileName}_ktp.jpg`, buffer, { contentType: 'image/jpeg' });
      if (ktpErr) return errorResponse('Gagal upload KTP secara aman: ' + ktpErr.message, 500);
      photo_ktp_url = ktpData.path;
    }

    // Upload Foto Rumah to Project B Vault Storage
    if (photo_rumah && photo_rumah.startsWith('data:image')) {
      if (!supabaseAdminB) return errorResponse('Project B Storage (Vault) not configured', 500);
      const buffer = base64ToBuffer(photo_rumah);
      const { data: houseData, error: houseErr } = await supabaseAdminB.storage
        .from('house_photos')
        .upload(`registrations/${fileName}_house.jpg`, buffer, { contentType: 'image/jpeg' });
      if (houseErr) return errorResponse('Gagal upload Foto Rumah secara aman: ' + houseErr.message, 500);
      
      const { data: { publicUrl } } = supabaseAdminB.storage.from('house_photos').getPublicUrl(houseData.path);
      photo_rumah_url = publicUrl;
    }

    // We use the exact same UUID for customers, psb_registrations, auth.user, and work_orders.customer_id
    const sharedId = crypto.randomUUID();
    const customerCode = await generateCustomerCode();

    // 1. Insert into customers table first (so FK relations don't fail)
    const { error: custErr } = await supabaseAdmin.from('customers').insert([{
      id: sharedId,
      customer_code: customerCode,
      name,
      phone,
      alt_phone,
      address,
      packet,
      lat,
      lng,
      photo_ktp: photo_ktp_url,
      photo_rumah: photo_rumah_url
    }]);

    if (custErr) {
      if (custErr.message && custErr.message.toLowerCase().includes('unique')) {
         return errorResponse('Nomor telepon ini sudah terdaftar. Silakan gunakan nomor lain.', 400);
      }
      return errorResponse(`Database error (customers): ${custErr.message}`, 500);
    }

    // 2. Insert into psb_registrations table
    const { data, error } = await supabaseAdmin
      .from('psb_registrations')
      .insert([
        {
          id: sharedId,
          name,
          phone,
          alt_phone,
          address,
          packet,
          lat,
          lng,
          photo_ktp: photo_ktp_url,
          photo_rumah: photo_rumah_url,
          status: 'waiting'
        }
      ])
      .select('id, secret_token, name, status')
      .single();

    if (error) {
      return errorResponse(`Database error (psb_registrations): ${error.message}`, 500);
    }

    // Directly send WhatsApp message with tracking link
    try {
      const cfg = await getTokenConfig();
      if (cfg && cfg.token) {
        const origin = new URL(req.url).origin;
        const magicLink = `${origin}/enduser/tracking.html?token=${data.secret_token}`;
        const message = `{Halo|Hai|Selamat datang} *${data.name}*! Pendaftaran Pemasangan Baru (PSB) layanan internet Anda telah kami terima.\n\nAnda dapat melacak status pendaftaran Anda secara realtime melalui tautan berikut:\n${magicLink}\n\nTerima kasih! 🙏`;
        
        await sendWhatsApp({
          token: cfg.token,
          target: phone,
          message: message,
          delay: '2-5',
          typingDuration: 3
        });
      } else {
        console.warn(`[WA-SKIP] Fonnte WA configuration missing. Link tracking: ?token=${data.secret_token}`);
      }
    } catch (waErr) {
      console.error('[WA-FAIL] Failed to send WA notification on register:', waErr);
    }

    // 3. Create Work Order (Antrian PSB)
    try {
      const { data: psbType } = await supabaseAdmin
        .from('master_queue_types')
        .select('id')
        .eq('name', 'PSB')
        .single();

      if (psbType) {
        const { error: woErr } = await supabaseAdmin.from('work_orders').insert([{
          customer_id: sharedId, // Reusing customer_id perfectly
          type_id: psbType.id,
          status: 'waiting',
          source: 'customer',
          title: 'Pemasangan Baru (PSB)',
          registration_date: new Date().toISOString().split('T')[0],
          alt_phone: phone,
          photo_url: photo_rumah_url,
          ket: 'Paket: ' + packet,
          created_at: new Date().toISOString()
        }]);
        if (woErr) console.warn("[WO-WARN] Gagal membuat antrian PSB otomatis:", woErr.message);
      }
    } catch (woError) {
      console.error('[WO-FAIL] Gagal memproses Work Order:', woError);
    }

    return jsonResponse(
      { message: 'Registration successful', data },
      201
    );

  } catch (error) {
    console.error('Register PSB error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
