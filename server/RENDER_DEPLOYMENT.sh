#!/bin/bash
# ============================================
# JOYNAILART SERVER - RENDER DEPLOYMENT GUIDE
# ============================================

echo "🚀 Starting Render Deployment Setup..."
echo ""

# STEP 1: Prepare repository
echo "📝 STEP 1: Prepare your git repository"
echo "Run these commands in your project root:"
echo ""
echo "# Initialize git if not already done"
echo "git init"
echo ""
echo "# Remove old credentials file"
echo "git rm --cached _env"
echo "rm _env"
echo ""
echo "# Add new files"
echo "git add package.json render.yaml .env.example .gitignore"
echo "git commit -m 'chore: prepare for Render deployment'"
echo ""

# STEP 2: Push to GitHub
echo "📤 STEP 2: Push to GitHub"
echo "git push origin main"
echo ""

# STEP 3: Create Render account
echo "🔑 STEP 3: Create Render account"
echo "1. Go to: https://dashboard.render.com"
echo "2. Sign up with GitHub"
echo "3. Connect your GitHub repository"
echo ""

# STEP 4: Create new web service
echo "⚙️  STEP 4: Create New Web Service on Render"
echo "1. Click 'New +' → 'Web Service'"
echo "2. Select your GitHub repository"
echo "3. Fill in these details:"
echo "   - Name: joynailart-server"
echo "   - Environment: Node"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "   - Instance Type: Free"
echo ""

# STEP 5: Add environment variables
echo "🔐 STEP 5: Add Environment Variables in Render"
echo "In the 'Environment' section, add:"
echo ""
echo "KEY                    | VALUE"
echo "----------------------------------------"
echo "NODE_ENV               | production"
echo "PORT                   | 3000"
echo "SUPABASE_URL           | https://qalkmishchxdxlmqcefc.supabase.co"
echo "SUPABASE_SERVICE_KEY   | (your NEW rotated key)"
echo "JWT_SECRET             | (your NEW strong secret)"
echo "SETUP_KEY              | joy-admin-setup-2026"
echo "SETUP_DONE             | true"
echo "CALLMEBOT_PHONE        | +254706158499"
echo "CALLMEBOT_API_KEY      | (your API key)"
echo ""

# STEP 6: Deploy
echo "🚀 STEP 6: Deploy"
echo "Click 'Create Web Service' - deployment starts automatically!"
echo ""

# STEP 7: Monitor
echo "📊 STEP 7: Monitor Deployment"
echo "1. Go to your service dashboard"
echo "2. Check 'Logs' tab for deployment status"
echo "3. Service URL: https://joynailart-server.onrender.com"
echo ""

echo "✅ All done! Your app should be live in 2-3 minutes."
echo ""
