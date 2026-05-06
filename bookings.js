const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const requireAuth = require('../middleware/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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

    res.status(201).json({ success: true, booking: data });
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
