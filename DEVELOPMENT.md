# Development Environment Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ (LTS)
- npm 9+
- MongoDB Atlas account (or local MongoDB)
- Stripe account (for payment testing)
- SendGrid account (for email)

### 1. Initial Setup (One-time)

```bash
# Clone the repository (if not already)
cd /Users/ayomi/apex-five-cleaning

# Install all dependencies
npm install --prefix client && npm install --prefix server

# Create environment files
cp client/.env.example client/.env
cp server/.env.example server/.env

# Edit environment files with your credentials
# - server/.env: MongoDB, Stripe keys, SendGrid, JWT secret
# - client/.env: VITE_API_URL and Stripe public key
```

### 2. Running Locally

**Option A: Run both servers simultaneously**

Terminal 1 (Backend):
```bash
cd server && npm run dev
# Starts on http://localhost:5001
```

Terminal 2 (Frontend):
```bash
cd client && npm run dev
# Starts on http://localhost:5173
```

**Option B: Use VS Code Task Runner**
1. Open Command Palette: `Cmd + Shift + P`
2. Run `Tasks: Run Task` → `Start Backend (Dev)` (Terminal 1)
3. Run `Tasks: Run Task` → `Start Frontend (Dev)` (Terminal 2)

**Option C: Full Stack Debugging**
1. Press `F5` to start debugging
2. Select `Full Stack (Server + Frontend)` configuration
3. VSCode will launch both debugger sessions

### 3. Environment Variables

**server/.env:**
```
PORT=5001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/apex-five?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
ADMIN_TOKEN=admin_bearer_token_here
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
SENDGRID_API_KEY=SG.xxxxx
ADMIN_EMAIL=admin@apexfivecleaning.co.uk
NODE_ENV=development
```

**client/.env:**
```
VITE_API_URL=http://localhost:5001
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
```

### 4. Testing

**Frontend Tests:**
```bash
cd client

# Run tests once
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch
```

**Backend Tests:**
Not yet configured. Add Jest/Mocha when needed.

### 5. Code Quality

**Format code (Prettier):**
```bash
npx prettier --write src/
```

**Run linting (ESLint):**
Currently ESLint is configured but no lint script defined. Add to package.json if needed:
```json
"lint": "eslint src/"
```

**Check for security issues:**
```bash
npm audit              # Show vulnerabilities
npm audit fix          # Auto-fix non-breaking
npm audit fix --force  # Fix all (may break things)
```

### 6. Database

**Connect to MongoDB Atlas in VSCode:**
1. Open MongoDB extension (left sidebar)
2. Click "Add Connection"
3. Paste your MongoDB URI from `.env`
4. Browse collections and documents

**Local MongoDB (optional):**
```bash
# Install via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

### 7. API Testing

**Using REST Client extension:**
1. Create `test.http` or `.rest` file
2. Example:
```
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```
3. Click "Send Request" above the request

**Using cURL:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 8. Stripe Testing

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`
- Expiry: Any future date (MM/YY)
- CVC: Any 3 digits

**Stripe CLI (testing webhooks locally):**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Listen for events
stripe listen --forward-to localhost:5001/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
```

### 9. Debugging

**Debug Backend:**
1. Add breakpoint by clicking on line number
2. Open Command Palette: `Cmd + Shift + P`
3. Select "Debug: Start Debugging" → `Backend (Node)`
4. VSCode pauses at breakpoints

**Debug Frontend:**
1. Run `npm run dev` in client folder
2. Open Chrome DevTools: `Cmd + Option + I`
3. Use React DevTools and Vue/React Devtools extensions

**View Logs:**
```bash
# Backend logs (terminal output)
# Frontend logs (browser console)
# MongoDB logs (check Atlas dashboard or local logs)
```

### 10. Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm audit` | Check for security issues |
| `npm audit fix` | Auto-fix security issues |
| `npm install` | Install dependencies |
| `npm update` | Update packages |

### 11. Project Structure Quick Reference

```
.
├── .vscode/               # VSCode configuration
│   ├── settings.json     # Editor settings
│   ├── launch.json       # Debug configurations
│   ├── tasks.json        # Development tasks
│   └── extensions.json   # Recommended extensions
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route pages
│   │   ├── context/      # React context (auth, announcements)
│   │   ├── data/         # Static data files
│   │   ├── utils/        # Helper functions
│   │   └── config/       # Configuration
│   └── public/           # Static assets
├── server/               # Express API
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Route handlers
│   │   ├── models/       # Mongoose schemas
│   │   ├── middleware/   # Express middleware
│   │   └── utils/        # Helper functions
│   └── uploads/          # Uploaded files
├── docs/                 # Reference documentation
│   ├── DEPLOYMENT.md     # Deploy to production
│   ├── SECURITY.md       # Security practices
│   ├── SEO.md           # SEO configuration
│   └── EMAIL.md         # Email service setup
└── .instructions.md      # This workspace's agent instructions
```

### 12. Troubleshooting

**Port already in use:**
```bash
# Find and kill process on port 5001
lsof -i :5001
kill -9 <PID>
```

**MongoDB connection error:**
- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas IP whitelist (add your IP)
- Ensure database user has correct permissions

**Module not found:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Stripe key errors:**
- Verify keys are from Test mode (not Live)
- Confirm `STRIPE_SECRET_KEY` in `.env`
- Restart backend after changing `.env`

**Hot reload not working:**
- Restart dev server
- Check if file is in `src/` directory
- Verify Vite config in `vite.config.js`

### 13. VS Code Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd + Shift + P` | Command Palette |
| `Cmd + /` | Toggle comment |
| `Option + Shift + F` | Format document |
| `Cmd + D` | Select next occurrence |
| `Cmd + K, Cmd + C` | Add line comment |
| `F12` | Go to definition |
| `Shift + F12` | Show references |
| `Cmd + B` | Toggle sidebar |
| `Cmd + J` | Toggle terminal |
| `F5` | Start debugging |

### 14. Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Docs](https://www.mongodb.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

**Questions?** Check the project's documentation files in `/docs/` for detailed information on deployment, security, SEO, and email configuration.
