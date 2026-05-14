# Apex Five Cleaning - Setup Checklist & Quick Reference

## Development Environment Setup (✅ COMPLETE)

### ✅ VS Code Extensions Installed
- ESLint (JavaScript/TypeScript linting)
- Prettier (Code formatter)
- Tailwind CSS IntelliSense (CSS classes)
- Debugger for Chrome (Frontend debugging)
- MongoDB for VS Code (Database browser)
- Docker (Container management)
- Vitest Explorer (Test runner UI)
- Makefile Tools

### ✅ Configuration Files Created
- `.vscode/settings.json` - Editor and format settings
- `.vscode/launch.json` - Debug configurations for backend, frontend, and tests
- `.vscode/tasks.json` - Development tasks (build, run, test, audit)
- `.vscode/extensions.json` - Recommended extensions list
- `.instructions.md` - Workspace-level agent instructions
- `DEVELOPMENT.md` - Complete development setup guide

### ✅ Dependencies Installed
- **Client**: React 18, Vite, Tailwind CSS, Stripe, testing libraries
- **Server**: Express, MongoDB/Mongoose, Stripe SDK, authentication, email services

## Quick Start Commands

### Development Servers
```bash
# Terminal 1 - Backend
cd server && npm run dev          # :5001

# Terminal 2 - Frontend  
cd client && npm run dev          # :5173
```

### Testing
```bash
cd client && npm test             # Single run
cd client && npm run test:watch   # Watch mode
```

### Code Quality
```bash
# Lint
npx eslint src/

# Format
npx prettier --write src/

# Audit security
npm audit                         # Check
npm audit fix                     # Fix non-breaking
npm audit fix --force             # Fix all
```

## Environment Setup

### Required .env Files
1. **server/.env** - Backend configuration
   - MongoDB connection
   - Stripe API keys
   - Email service (SendGrid or SMTP)
   - JWT secret
   - Admin token

2. **client/.env** - Frontend configuration
   - API base URL (http://localhost:5001 for dev)
   - Stripe publishable key
   - reCAPTCHA site key (optional)

### Getting Credentials
- **MongoDB**: MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
- **Stripe**: Stripe Dashboard (https://dashboard.stripe.com)
- **SendGrid**: SendGrid Console (https://app.sendgrid.com) or use SMTP
- **reCAPTCHA**: Google reCAPTCHA (https://www.google.com/recaptcha/admin)

## Project Structure
```
client/        → React SPA (npm run dev :5173)
server/        → Express API (npm run dev :5001)
.vscode/       → Debugger, tasks, settings
docs/          → Deployment, security, SEO guides
DEVELOPMENT.md → Full setup guide (you are here)
.instructions.md → Agent instructions for this workspace
```

## Debugging

### Start Debug Session
1. Press `F5` or `Cmd + Shift + D`
2. Choose configuration:
   - **Backend (Node)** - Debug Express server
   - **Frontend (Chrome)** - Debug React in Chrome
   - **Full Stack** - Debug both together

### Common Debug Tasks
- Set breakpoints: Click line number in editor
- Step through: F10 (step over), F11 (step into), Shift+F11 (step out)
- Watch variables: Right-click and "Add to Watch"
- Evaluate expressions: Debug console (Cmd + Shift + Y)

## Running Tasks from VS Code

1. Open Command Palette: `Cmd + Shift + P`
2. Type `Tasks: Run Task`
3. Select from available tasks:
   - Install All Dependencies
   - Start Backend (Dev)
   - Start Frontend (Dev)
   - Build Frontend
   - Run Client Tests
   - Run Linting
   - Format Code
   - Audit Dependencies
   - Fix Audit Issues

## API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/signup | Register customer |
| POST | /api/auth/login | Login customer |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/verify | Verify email token |
| POST | /api/quotes | Create quote request |
| GET | /api/quotes | Get quotes (admin) |
| POST | /api/bookings | Create booking |
| GET | /api/bookings | Get customer's bookings |
| POST | /api/payments | Process payment |
| GET | /api/admin/dashboard | Admin stats |

## Frontend Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| / | Home | Landing page |
| /services | Services | Service catalog |
| /services/:id | ServiceDetail | Individual service |
| /service-areas | ServiceAreas | Coverage map |
| /quote | Quote | Quote generator |
| /blog | Blog | Blog listing |
| /blog/:slug | BlogPost | Individual post |
| /contact | Contact | Contact form |
| /pay-online | PayOnline | Payment page |
| /dashboard | CustomerDashboard | Customer portal |
| /admin | AdminDashboard | Admin panel (protected) |

## Important Files to Know

### Backend
- `server/src/index.js` - Main server file
- `server/src/routes/` - API endpoint definitions
- `server/src/middleware/auth.js` - Authentication middleware
- `server/src/models/` - Database schemas
- `server/.env` - Environment configuration

### Frontend
- `client/src/App.jsx` - Main app component
- `client/src/main.jsx` - App entry point
- `client/src/pages/` - Route pages
- `client/src/components/` - Reusable components
- `client/.env` - Frontend configuration

## Troubleshooting

### Port already in use
```bash
lsof -i :5001              # Find process
kill -9 <PID>              # Kill it
```

### Module not found
```bash
rm -rf node_modules
npm install
```

### Dependencies outdated
```bash
npm update
npm outdated               # Check for updates
```

### Database connection issues
- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas IP whitelist
- Ensure database credentials are correct

### Frontend not connecting to backend
- Verify `VITE_API_URL` in `client/.env`
- Check backend is running on :5001
- Clear browser cache/localStorage

## Documentation Files

- **DEVELOPMENT.md** (this file) - Full setup guide
- **docs/DEPLOYMENT.md** - Production deployment
- **docs/SECURITY.md** - Security best practices
- **docs/SEO.md** - SEO configuration
- **docs/EMAIL.md** - Email service setup

## Helpful Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm test` | Run tests once |
| `npm run test:watch` | Watch mode testing |
| `npm audit` | Check security |
| `npm audit fix` | Auto-fix vulnerabilities |
| `npm install` | Install dependencies |
| `npm update` | Update all packages |

## Next Steps

1. **Set up environment files:**
   ```bash
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   # Edit with your credentials
   ```

2. **Start development:**
   ```bash
   # Terminal 1
   cd server && npm run dev
   
   # Terminal 2
   cd client && npm run dev
   ```

3. **Open in browser:** http://localhost:5173

4. **Start debugging:** Press `F5` and select configuration

5. **Check docs:** Read `docs/` folder for deployment and security info

---

**Created:** May 11, 2026 | **Last Updated:** Setup Complete
