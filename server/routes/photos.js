const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const requireAuth = require('../middleware/auth');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = 'gallery';

// multer: store in memory, max 10MB, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// GET /api/photos  — public, returns all gallery photos with public URLs
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).list('', {
      sortBy: { column: 'created_at', order: 'desc' }
    });

    if (error) throw error;

    // Build public URL for each file
    const photos = data
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => {
        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(f.name);
        return {
          name: f.name,
          url: urlData.publicUrl,
          created_at: f.created_at,
          size: f.metadata?.size
        };
      });

    res.json(photos);
  } catch (err) {
    console.error('Get photos error:', err);
    res.status(500).json({ error: 'Could not fetch photos' });
  }
});

// POST /api/photos  — admin only, upload a photo
router.post('/', requireAuth, upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  // Create a unique filename: timestamp + original name
  const timestamp = Date.now();
  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `${timestamp}${ext}`;

  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename);

    res.status(201).json({
      success: true,
      name: filename,
      url: urlData.publicUrl
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// DELETE /api/photos/:filename  — admin only
router.delete('/:filename', requireAuth, async (req, res) => {
  const { filename } = req.params;

  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([filename]);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete photo error:', err);
    res.status(500).json({ error: 'Could not delete photo' });
  }
});

module.exports = router;
