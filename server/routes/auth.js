const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Look up admin by email
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sign JWT - valid for 8 hours
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, email: admin.email });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/setup
// One-time route to create the first admin. Disable after use by setting SETUP_DONE=true in .env
router.post('/setup', async (req, res) => {
  if (process.env.SETUP_DONE === 'true') {
    return res.status(403).json({ error: 'Setup already complete' });
  }

  const { email, password, setupKey } = req.body;

  if (setupKey !== process.env.SETUP_KEY) {
    return res.status(403).json({ error: 'Invalid setup key' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 12);

    const { error } = await supabase
      .from('admins')
      .insert([{ email: email.toLowerCase().trim(), password_hash }]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Admin created successfully. Set SETUP_DONE=true in your .env now.' });
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
