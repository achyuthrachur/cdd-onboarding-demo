# CDD Onboarding Demo - Deployment Guide

Complete guide for setting up, configuring, and deploying the CDD Onboarding Demo application.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Demo Mode)](#quick-start-demo-mode)
3. [Environment Variables](#environment-variables)
4. [Service Setup](#service-setup)
   - [Neon Database](#1-neon-database-required-for-persistence)
   - [Vercel Blob Storage](#2-vercel-blob-storage-required-for-file-uploads)
   - [OpenAI API](#3-openai-api-optional-for-ai-features)
   - [NextAuth](#4-nextauth-optional-for-authentication)
5. [Local Development](#local-development)
6. [Database Migrations](#database-migrations)
7. [Deploying to Vercel](#deploying-to-vercel)
8. [Deploying to Other Platforms](#deploying-to-other-platforms)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** 18.17 or later
- **npm** 9+ or **pnpm** 8+
- **Git** for version control
- A **GitHub account** (for Vercel deployment)

---

## Quick Start (Demo Mode)

The application works **without any environment variables** in demo mode using in-memory storage and mock data.

```bash
# Clone the repository
git clone https://github.com/achyuthrachur/cdd-onboarding-demo.git
cd cdd-onboarding-demo

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

> **Note:** In demo mode, data is stored in memory and will be lost when the server restarts. AI features return mock responses.

---

## Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.example .env.local
```

### Required Variables

| Variable | Required For | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Persistence | Neon Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | File uploads | Vercel Blob storage token |

### Optional Variables

| Variable | Required For | Description |
|----------|-------------|-------------|
| `OPENAI_API_KEY` | AI features | OpenAI API key for gap assessment |
| `NEXTAUTH_SECRET` | Authentication | Secret for NextAuth.js sessions |
| `NEXTAUTH_URL` | Authentication | Base URL for NextAuth callbacks |

### Complete `.env.local` Example

```env
# Database (Neon Postgres)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx

# OpenAI API (optional - enables AI gap assessment)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# NextAuth (optional - enables authentication)
NEXTAUTH_SECRET=your-32-character-secret-here
NEXTAUTH_URL=http://localhost:3000
```

---

## Service Setup

### 1. Neon Database (Required for Persistence)

[Neon](https://neon.tech) provides serverless Postgres that works seamlessly with Vercel.

#### Setup Steps

1. **Create Neon Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up with GitHub, Google, or email

2. **Create a New Project**
   - Click "New Project"
   - Choose a name (e.g., `cdd-onboarding`)
   - Select region closest to your Vercel deployment (e.g., `us-east-1`)
   - Click "Create Project"

3. **Get Connection String**
   - After project creation, you'll see the connection string
   - Copy the **pooled connection string** (recommended for serverless)
   - It looks like: `postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

4. **Add to Environment**
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

#### Database Schema

The schema is defined in `src/lib/db/schema.ts` and includes:
- `audit_runs` - Root entity for audit workflows
- `documents` - Uploaded document files
- `stage1_results` - Gap assessment and attribute extraction
- `population_files` - Population data for sampling
- `samples` - Sampling configuration and results
- `workbooks` - Spreadsheet state (Handsontable)
- `workbook_rows` - Individual test results
- `consolidations` - Aggregated results
- `reports` - Generated reports

---

### 2. Vercel Blob Storage (Required for File Uploads)

[Vercel Blob](https://vercel.com/docs/storage/vercel-blob) provides file storage for uploaded documents and exports.

#### Setup Steps

1. **Vercel Account Required**
   - Sign up at [vercel.com](https://vercel.com) if you haven't

2. **Create Blob Store**
   - Go to your Vercel dashboard
   - Navigate to **Storage** tab
   - Click **Create Database** → **Blob**
   - Name it (e.g., `cdd-onboarding-files`)
   - Click **Create**

3. **Get Token**
   - In the Blob store settings, go to **Tokens**
   - Create a new Read/Write token
   - Copy the token value

4. **Add to Environment**
   ```env
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
   ```

#### Usage in the App

Blob storage is used for:
- Uploaded PDF/Excel documents (Stage 1)
- Population Excel files (Stage 2)
- Exported workbooks (Stage 3)
- Generated reports (Stage 4)

---

### 3. OpenAI API (Optional - for AI Features)

The OpenAI API powers the AI-assisted gap assessment and attribute extraction features.

#### Setup Steps

1. **Create OpenAI Account**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Sign up and verify your account

2. **Add Payment Method**
   - Navigate to **Billing** → **Payment methods**
   - Add a credit card (required for API usage)

3. **Create API Key**
   - Go to **API Keys** section
   - Click **Create new secret key**
   - Name it (e.g., `cdd-onboarding`)
   - Copy the key immediately (shown only once)

4. **Add to Environment**
   ```env
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
   ```

#### Cost Considerations

| Model | Used For | Cost (approx) |
|-------|----------|---------------|
| `gpt-4-turbo-preview` | Gap assessment | ~$0.01-0.03 per analysis |
| `gpt-4-turbo-preview` | Attribute extraction | ~$0.01-0.02 per extraction |

Set usage limits in OpenAI dashboard to prevent unexpected charges.

#### Demo Mode

If `OPENAI_API_KEY` is not set, the app automatically uses mock responses for:
- Gap assessment results
- Attribute extraction results

---

### 4. NextAuth (Optional - for Authentication)

NextAuth.js provides authentication if you need user login functionality.

#### Setup Steps

1. **Generate Secret**
   ```bash
   # On macOS/Linux
   openssl rand -base64 32

   # On Windows (PowerShell)
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
   ```

2. **Add to Environment**
   ```env
   NEXTAUTH_SECRET=your-generated-32-character-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Production URL**
   ```env
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

> **Note:** Authentication is not currently enforced in the app but the infrastructure is in place.

---

## Local Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations |
| `npm run db:push` | Push schema directly (dev) |
| `npm run db:studio` | Open Drizzle Studio |

---

## Database Migrations

### Initial Setup

After setting up your Neon database:

```bash
# Push schema directly to database (for development)
npm run db:push
```

### Creating Migrations (for production)

```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate
```

### Viewing Data

```bash
# Open Drizzle Studio (GUI for database)
npm run db:studio
```

This opens a local web interface to view and manage your database.

---

## Deploying to Vercel

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your GitHub repository
   - Click **Import**

3. **Configure Environment Variables**
   - In the project settings, go to **Environment Variables**
   - Add each variable:
     - `DATABASE_URL`
     - `BLOB_READ_WRITE_TOKEN`
     - `OPENAI_API_KEY` (optional)
     - `NEXTAUTH_SECRET` (optional)
     - `NEXTAUTH_URL` (set to your Vercel domain)

4. **Deploy**
   - Click **Deploy**
   - Wait for build to complete

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

### Environment Variables in Vercel

Set environment variables in the Vercel dashboard:

1. Go to your project in Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add variables for each environment:
   - **Production**
   - **Preview**
   - **Development**

### Automatic Deployments

Once connected to GitHub:
- **Push to `main`** → Production deployment
- **Push to any branch** → Preview deployment
- **Pull requests** → Preview deployment with unique URL

---

## Deploying to Other Platforms

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

Update `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
};
```

Build and run:

```bash
docker build -t cdd-onboarding .
docker run -p 3000:3000 --env-file .env.local cdd-onboarding
```

### Railway

1. Connect your GitHub repo to [Railway](https://railway.app)
2. Add environment variables in Railway dashboard
3. Deploy automatically

### Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set build command: `npm run build`
4. Set start command: `npm run start`
5. Add environment variables

---

## Troubleshooting

### Build Fails with Font Errors

If you see TLS errors fetching Google Fonts during build:

```
Error while requesting https://fonts.googleapis.com/...
```

**Solution:** The app uses `<link>` tags for fonts (runtime loading) instead of `next/font/google` (build-time loading). If issues persist, check your network/proxy settings.

### Database Connection Errors

```
Error: Connection refused
```

**Solutions:**
1. Verify `DATABASE_URL` is correct
2. Check Neon project is active (not suspended)
3. Ensure `?sslmode=require` is in the connection string
4. Check Neon dashboard for connection issues

### OpenAI API Errors

```
OpenAI API error: 401 Unauthorized
```

**Solutions:**
1. Verify API key is correct
2. Check API key has not been revoked
3. Ensure billing is set up on OpenAI account

### Blob Storage Errors

```
Error: Unauthorized
```

**Solutions:**
1. Verify `BLOB_READ_WRITE_TOKEN` is correct
2. Ensure token has read/write permissions
3. Check token hasn't expired

### "Module not found" Errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### TypeScript Errors

```bash
# Check for type errors
npx tsc --noEmit
```

---

## Application Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui, Radix UI |
| Database | Neon Postgres + Drizzle ORM |
| File Storage | Vercel Blob |
| AI | OpenAI GPT-4 |
| Spreadsheet | Handsontable |
| Auth | NextAuth.js |

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── ai/           # AI endpoints (gap assessment, extraction)
│   │   ├── sampling/     # Statistical sampling
│   │   └── ...
│   ├── audit-runs/       # Audit workflow pages
│   │   └── [id]/        # Dynamic routes for stages
│   └── layout.tsx        # Root layout with fonts
├── components/            # React components
│   ├── stage-1/         # Gap assessment components
│   ├── stage-2/         # Sampling components
│   ├── stage-3/         # Workbook components
│   ├── stage-4/         # Reporting components
│   ├── attribute-library/ # Attribute Library UI
│   ├── modals/          # Dialog components
│   └── ui/              # Base UI components (shadcn)
├── lib/                   # Shared libraries
│   ├── ai/              # OpenAI client & prompts
│   ├── db/              # Drizzle schema & client
│   ├── sampling/        # Statistical sampling engine
│   ├── consolidation/   # Results aggregation
│   └── narrative/       # AI prompt builders
└── globals.css           # Global styles & Design System
```

### 4-Stage Workflow

1. **Stage 1: Gap Assessment** - Upload documents, run AI analysis
2. **Stage 2: Statistical Sampling** - Configure and generate samples
3. **Stage 3: Testing Workbooks** - Attribute Library and Test Grid generation
4. **Stage 4: Reporting** - Consolidation and report generation

---

## Support

- **GitHub Issues:** [github.com/achyuthrachur/cdd-onboarding-demo/issues](https://github.com/achyuthrachur/cdd-onboarding-demo/issues)
- **Documentation:** See `/Design_System.md` for UI guidelines
