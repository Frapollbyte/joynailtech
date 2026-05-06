const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const requireAuth = require('../middleware/auth');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// CALLMEBOT WHATSAPP SERVICE
// ============================================
const sendWhatsAppAlert = async (bookingData) => {
  try {
    const { id, name, phone, service, date, time, notes, email } = bookingData;
    
    // Format the WhatsApp message for admin
    const message = `
🆕 NEW BOOKING - joynailart

📋 Booking ID: #${id}
👤 Customer: ${name}
📱 Phone: ${phone}
${email ? `📧 Email: ${email}` : ''}
🛠️ Service: ${service}
📅 Date: ${date}
⏰ Time: ${time}
${notes ? `📝 Notes: ${notes}` : ''}
    `.trim();

    // URL encode the message
    const encodedMessage = encodeURIComponent(message);
    
    // Send to CallMeBot API
    const callmebotPhone = process.env.CALLMEBOT_PHONE;
    const callmebotKey = process.env.CALLMEBOT_API_KEY;
    
    if (!callmebotPhone || !callmebotKey) {
      console.warn('⚠ CallMeBot credentials not configured');
      return false;
    }
    
    const url = `https://api.callmebot.com/whatsapp.php?phone=${callmebotPhone}&text=${encodedMessage}&apikey=${callmebotKey}`;
    
    const response = await axios.get(url, { timeout: 10000 });
    
    console.log('✓ WhatsApp alert sent to admin');
    return true;
  } catch (error) {
    console.error('✗ Failed to send WhatsApp alert:', error.message);
    return false;
  }
};

// POST /api/bookings  — public, called from your booking form
router.post('/', async (req, res) => {
  const { name, phone, email, service, date, time, notes } = req.body;

  if (!name || !phone || !service || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{ name, phone, email: email || null, service, date, time, notes: notes || null }])
      .select()
      .single();

    if (error) throw error;

    // ============================================
    // SEND WHATSAPP ALERT TO ADMIN
    // ============================================
    const alertSent = await sendWhatsAppAlert(data);

    res.status(201).json({ 
      success: true, 
      booking: data,
      alertSent: alertSent,
      message: alertSent ? '✓ Booking confirmed! Admin notified.' : '✓ Booking saved (alert sending...)'
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Could not save booking' });
  }
});

// GET /api/bookings  — admin only, returns all bookings newest first
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, date } = req.query;

    let query = supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (date) query = query.eq('date', date);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Could not fetch bookings' });
  }
});

// PATCH /api/bookings/:id  — admin only, update status
router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: 'Could not update booking' });
  }
});

// DELETE /api/bookings/:id  — admin only
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ error: 'Could not delete booking' });
  }
});

module.exports = router;