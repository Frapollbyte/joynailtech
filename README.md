# joynailart — Backend Setup Guide

## Project Structure

```
joynailart/
├── public/               ← Your existing frontend (copy everything here)
│   ├── index.html
│   ├── style.css
│   ├── script.js         ← Use the new version provided
│   ├── admin.html        ← New admin panel
│   └── nails/            ← Your photo folder (for existing images)
│
└── server/               ← New backend
    ├── index.js
    ├── package.json
    ├── .env              ← Create this from .env.example (NEVER commit to git)
    ├── middleware/
    │   └── auth.js
    └── routes/
        ├── auth.js
        ├── bookings.js
        └── photos.js
```

---

## Step 1 — Set up Supabase

1. Go to https://supabase.com and create a free account
2. Create a new project (e.g. "joynailart")
3. Wait for it to provision (~2 minutes)
4. Go to **SQL Editor** → **New Query** → paste the contents of `supabase-setup.sql` → Run
5. Go to **Storage** → **New Bucket** → Name: `gallery` → Toggle **Public: ON** → Create
6. Go to **Project Settings** → **API** and copy:
   - **Project URL** (looks like `https://abcxyz.supabase.co`)
   - **service_role key** (the long one under "Project API keys")

---

## Step 2 — Configure environment variables

In the `server/` folder, create a `.env` file:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

JWT_SECRET=run-this-in-terminal-to-generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# CallMeBot WhatsApp notifications (admin alerts for new bookings)
CALLMEBOT_PHONE=your-phone-number-here
CALLMEBOT_API_KEY=your-api-key-here

SETUP_KEY=any-secret-phrase-you-choose
SETUP_DONE=false

FRONTEND_URL=*
PORT=3000
```

---

## Step 3 — Install and run locally

```bash
cd server
npm install
npm run dev
```

Your site will be at http://localhost:3000
Your admin panel will be at http://localhost:3000/admin.html

---

## Step 4 — Create your admin account (one time only)

Run this in your terminal (or use Postman/curl):

```bash
curl -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword","setupKey":"the-setup-key-from-env"}'
```

After this, open `.env` and set `SETUP_DONE=true` so nobody can call setup again.

---

## Step 5 — Deploy to Render

1. Push your project to a GitHub repo
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root directory**: `server`
   - **Build command**: `npm install`
   - **Start command**: `node index.js`
5. Under **Environment Variables**, add all your `.env` variables
6. Deploy — Render gives you a URL like `https://joynailart.onrender.com`
7. Your admin panel: `https://joynailart.onrender.com/admin.html`

---

## How it works day-to-day

**For clients:**
- They fill in the booking form on your site
- Click "Confirm Booking"
- See success message ✓
- **No WhatsApp opens** — booking is sent directly to your system

**For you (admin):**
- New booking triggers an **instant WhatsApp alert** to your phone (254724375331)
- Message includes: customer name, phone, service, date/time, notes
- Go to `/admin.html` to manage bookings and upload gallery photos
- Log in with your email + password
- **Bookings tab**: see all appointments, filter by status/date, mark as confirmed/done/cancelled
- **Gallery tab**: upload new nail photos, delete old ones — they appear on your live site

---

## Making gallery photos appear on your site

To show photos from Supabase Storage in your gallery section, fetch them dynamically.
Add this to your `script.js` or a separate script:

```javascript
async function loadGalleryFromSupabase() {
  try {
    const res = await fetch('/api/photos');
    const photos = await res.json();
    const grid = document.querySelector('.gallery-grid');
    if (!grid || !photos.length) return;

    // Optionally clear existing hardcoded images:
    // grid.innerHTML = '';

    photos.forEach(photo => {
      const article = document.createElement('article');
      article.className = 'gallery-card animate-on-scroll';
      article.innerHTML = `
        <img src="${photo.url}" alt="joynailart nail design" loading="lazy" />
        <div class="gallery-copy">
          <h3>Fresh Work</h3>
          <p>Latest from our nail studio.</p>
        </div>
      `;
      grid.appendChild(article);
    });
  } catch (err) {
    console.log('Gallery load skipped:', err);
  }
}

loadGalleryFromSupabase();
```

---

## Security notes

- The admin panel is protected by JWT — only someone with your email + password can log in
- All admin API routes require the token
- Supabase Row Level Security is enabled — the database can only be accessed through your server
- CallMeBot API key is stored in `.env` — keep it private and never commit to git
- Never commit your `.env` file (add it to `.gitignore`)
- The service role key is powerful — keep it secret