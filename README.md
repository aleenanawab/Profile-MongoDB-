# Avtive Digital Profile Platform

> **Avtive** is a modern, high-performance digital identity and interactive profile platform built with **Next.js 16**, **React 19**, and **MongoDB**. It provides professionals and teams with customizable digital business cards, instant contact exchange, vCard/PDF generation, QR code sharing, and enterprise team directory management.

---

## Table of Contents

- [1. Project Overview & Features](#1-project-overview--features)
- [2. Technology Stack & Architecture](#2-technology-stack--architecture)
- [3. Prerequisites & Installation](#3-prerequisites--installation)
- [4. Local Development Commands](#4-local-development-commands)
- [5. Environment Variables](#5-environment-variables)
- [6. MongoDB Configuration](#6-mongodb-configuration)
- [7. Password-Reset Email Configuration](#7-password-reset-email-configuration)
- [8. GitHub Actions CI Testing](#8-github-actions-ci-testing)
- [9. Production & Vercel Deployment](#9-production--vercel-deployment)
- [10. Security Notes & Best Practices](#10-security-notes--best-practices)

---

## 1. Project Overview & Features

Avtive reimagines traditional business cards into interactive, real-time digital identity passes.

### Core Features

- **Dual-Screen Workspace Studio:** Simultaneous live desktop editor with real-time mobile card pass preview.
- **Customizable Themes & Personas:** Multiple curated styling themes (`editorial`, `minimal`, `modern`, `creative`, `dark`) with dynamic dark/light mode toggles.
- **Rich Identity Sections:**
  - **Hero & Identity:** Name, designation, company, avatar, custom cover images, and bio.
  - **Direct Contact Hub:** Phone, WhatsApp, email, website URL, and office location with Google Maps integration.
  - **Professional Background:** Work experience, portfolio projects, skills dataset tags, and services.
  - **Education & Credentials:** Institutions, degrees, certifications, and recommendations.
  - **Languages & Volunteerism:** Multi-language proficiency ratings and volunteer history.
  - **Custom Link Fields:** Arbitrary custom link and text fields for flexible branding.
- **Contact Sharing & Export:**
  - **Interactive QR Code:** Instant fullscreen modal and QR pass generation for in-person scanning.
  - **vCard (.vcf) Export:** One-click address-book download to iOS / Android Contacts.
  - **CR80 Standard PDF Generator:** Generates two-sided, high-resolution printable business cards via `jspdf`.
  - **Lead / Contact Capture:** Integrated "Exchange Contact" modal where visitors submit their info directly into your database.
- **Authentication & Security:**
  - Standard email and password authentication with `bcryptjs` hashing.
  - **Google OAuth 2.0 with PKCE (RFC 7636):** SHA-256 code challenge, HMAC-signed state, and nonce replay prevention.
  - Secure, signed HTTP-only session cookies.
  - Password reset with email verification or secure recovery codes.
- **Company & Team Management:**
  - Dedicated company records, verified badges, and customizable company cards.
  - Team member management with role-based access (`OWNER`, `ADMIN`, `MEMBER`) and invitation links.
- **Cloudinary Asset Storage:**
  - Server-side image uploads for profile pictures and banners with strict MIME-type and size validation.

---

## 2. Technology Stack & Architecture

### Frontend & Application Framework
- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Core Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) with PostCSS
- **Animations:** [Framer Motion 13](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend & Database
- **Database Engine:** [MongoDB Atlas](https://www.mongodb.com/atlas) (via official `mongodb` v7 driver)
- **Database Access:** Modular, connection-pooled client in `src/lib/db/` with automated compound indexing (`lazyEnsureIndexes`).
- **File & Media Storage:** [Cloudinary](https://cloudinary.com/) (Server-only authenticated SDK)
- **Email Delivery:** [Nodemailer](https://nodemailer.com/) (SMTP / Gmail) & [Resend API](https://resend.com/) fallback

### Architectural Layout

```
Profile(MongoDB)/
├── package.json                   # Root package orchestration
├── tsconfig.json                  # Root TypeScript configuration
└── Avtive-Profiles-main/          # Primary Next.js Application
    ├── package.json               # Next.js scripts & dependencies
    ├── next.config.ts             # Next.js build & image domain config
    ├── eslint.config.mjs          # ESLint 9 flat configuration
    ├── .env.example               # Safe environment variable template
    ├── public/                    # Static assets, fonts, icons
    ├── tests/                     # Automated test suites
    │   └── oauth-and-stabilization.test.ts
    ├── scripts/                   # Migration & utility scripts
    │   └── migrate-json-to-mongo.ts
    └── src/
        ├── app/                   # App Router pages and API routes
        │   ├── (auth)/            # Login, register, password resets
        │   ├── api/               # Server-side API endpoints
        │   ├── dashboard/         # User profile card dashboard
        │   ├── profile/           # Public and private profile views
        │   └── company/           # Team and company invite flows
        ├── components/            # Reusable UI & section components
        ├── context/               # React Context (Editor & Theme)
        ├── data/                  # Static datasets (Countries, Skills, Languages)
        ├── lib/
        │   ├── db/                # Modular MongoDB entities & queries
        │   ├── auth/              # JWT, sessions, Google PKCE OAuth
        │   ├── storage/           # Cloudinary uploader & URL sanitizers
        │   ├── email.ts           # SMTP & Resend email delivery
        │   ├── cardPdfGenerator.ts# jsPDF business card generator
        │   └── vcard.ts           # RFC-compliant vCard builder
        └── types/                 # Shared TypeScript interfaces
```

---

## 3. Prerequisites & Installation

### Prerequisites
- **Node.js:** `v20.x` or `v22.x` (LTS recommended)
- **Package Manager:** `npm` (v10+)
- **MongoDB Database:** MongoDB Atlas cluster or local MongoDB instance (v6.0+)
- **Cloudinary Account:** Free Cloudinary cloud for image hosting
- **Google Cloud Console:** (Optional) OAuth 2.0 Web Client credentials for Google Sign-In

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aleenanawab/Profile-MongoDB-.git
   cd Profile-MongoDB-
   ```

2. **Install root and application dependencies:**
   ```bash
   npm install
   cd Avtive-Profiles-main
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file inside the `Avtive-Profiles-main/` directory:
   ```bash
   cp .env.example .env.local
   ```
   *(Fill in your actual MongoDB URI, Cloudinary keys, and secret tokens as described in Section 5).*

---

## 4. Local Development Commands

You can run scripts either from the repository root or directly inside `Avtive-Profiles-main`.

### Running from Project Root:
```bash
# Start Next.js local development server
npm run dev

# Run ESLint validation
npm run lint

# Build production bundle
npm run build

# Start production server (after build)
npm run start

# Run automated test suite
npm test
```

### Running from `Avtive-Profiles-main/`:
```bash
cd Avtive-Profiles-main

# Start Next.js dev server at http://localhost:3000
npm run dev

# Run ESLint checking
npm run lint

# Run Next.js production build with Turbopack
npm run build

# Run test suite
npm test
```

---

## 5. Environment Variables

All environment variables should be defined in `Avtive-Profiles-main/.env.local`. **Never commit `.env.local` to version control.**

| Variable Name | Required | Default / Example | Description |
| :--- | :---: | :--- | :--- |
| `MONGODB_URI` | **Yes** | `mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority` | Full MongoDB connection string. |
| `MONGODB_DB_NAME` | **Yes** | `avtive_fresh` | The target database name inside MongoDB. |
| `SESSION_SECRET` | **Yes** | `your-random-32-byte-secret-key-min-32-chars` | Secret key used for signing session cookies and OAuth state. |
| `JWT_SECRET` | **Yes** | `your-random-32-byte-secret-key-min-32-chars` | Secret key for verification tokens. |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `http://localhost:3000` | Canonical public URL of the application. |
| `CLOUDINARY_CLOUD_NAME`| **Yes** | `your-cloud-name` | Cloudinary cloud name for media uploads. |
| `CLOUDINARY_API_KEY` | **Yes** | `123456789012345` | Cloudinary API Key. |
| `CLOUDINARY_API_SECRET` | **Yes** | `your_cloudinary_api_secret` | Cloudinary API Secret. |
| `GOOGLE_CLIENT_ID` | Optional | `your-client-id.apps.googleusercontent.com` | Google OAuth 2.0 Web Client ID for Google Sign-In. |
| `GOOGLE_CLIENT_SECRET` | Optional | `GOCSPX-yourClientSecret` | Google OAuth 2.0 Client Secret. |
| `SMTP_HOST` | Optional | `smtp.gmail.com` | SMTP email server host. |
| `SMTP_PORT` | Optional | `587` | SMTP port (`587` for TLS, `465` for SSL). |
| `SMTP_USER` | Optional | `your-email@gmail.com` | SMTP username or Gmail address. |
| `SMTP_PASS` | Optional | `your-16-char-app-password` | SMTP password or Gmail App Password. |
| `SMTP_FROM` | Optional | `"Avtive Security" <no-reply@yourdomain.com>` | Sender address for outgoing emails. |
| `RESEND_API_KEY` | Optional | `re_123456789` | Alternative API key for Resend email delivery. |
| `RESEND_FROM` | Optional | `Avtive Security <onboarding@resend.dev>` | Verified sender address for Resend. |

---

## 6. MongoDB Configuration

The application uses native MongoDB connection pooling with zero ORM overhead.

### 1. Database Setup on MongoDB Atlas
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create or select a cluster (the free M0 cluster is fully supported).
3. Under **Security → Database Access**, create a user with `Read and write to any database` privileges.
4. Under **Security → Network Access**, add your current IP address (or `0.0.0.0/0` for cloud deployment like Vercel).
5. Under **Clusters → Connect → Drivers**, copy the connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=avtive_fresh
   ```

### 2. Automatic Indexing
Indexes are lazily and automatically created upon initial request via [`src/lib/db/indexes.ts`](file:///c:/Users/PMLS/Downloads/aleena/Profile%28MongoDB%29/Avtive-Profiles-main/src/lib/db/indexes.ts):
- `users`: Unique index on `email`, index on `googleSub`.
- `profiles`: Unique index on `slug`, index on `userId`.
- `companies`: Unique index on `slug`, index on `ownerUserId`.
- `company_members`: Compound unique index on `{ companyId, email }`.
- `connections`: Compound index on `{ fromUserId, toProfileId }`.
- `sessions`: Index on `expiresAt` with automated TTL expiry.

---

## 7. Password-Reset Email Configuration

Password reset delivery is implemented in [`src/lib/email.ts`](file:///c:/Users/PMLS/Downloads/aleena/Profile%28MongoDB%29/Avtive-Profiles-main/src/lib/email.ts) with dual provider support:

### Option A: Gmail SMTP with App Passwords (Recommended for Development)
1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Enable **2-Step Verification**.
3. Under **App passwords**, create an entry for `Avtive Mailer`.
4. Copy the 16-character generated password into `.env.local`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=yourname@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop
   SMTP_FROM="Avtive Security" <yourname@gmail.com>
   ```

### Option B: Resend API (Recommended for Production)
1. Sign up at [Resend.com](https://resend.com) and generate an API key.
2. Add your key and verified domain to `.env.local`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   RESEND_FROM=Avtive Security <no-reply@yourverifieddomain.com>
   ```
*(Note: If neither provider is configured, the system provides one-time recovery code resets directly in the UI for local testing).*

---

## 8. GitHub Actions CI Testing

To automatically run linter checks and test suites on every pull request or push to GitHub, add a workflow file at `.github/workflows/ci.yml`:

```yaml
name: CI Pipeline

on:
  push:
    branches: [ main, stabilization-and-oauth ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: 'Avtive-Profiles-main/package-lock.json'

      - name: Install Dependencies
        run: |
          cd Avtive-Profiles-main
          npm ci

      - name: Run ESLint
        run: |
          cd Avtive-Profiles-main
          npm run lint

      - name: Run Next.js Build Check
        env:
          NEXT_PUBLIC_APP_URL: http://localhost:3000
          SESSION_SECRET: test-session-secret-key-32-chars-long
          JWT_SECRET: test-session-secret-key-32-chars-long
          MONGODB_URI: mongodb://localhost:27017/test
          MONGODB_DB_NAME: avtive_ci_test
        run: |
          cd Avtive-Profiles-main
          npm run build
```

---

## 9. Production & Vercel Deployment

The application is fully optimized for zero-config deployment on [Vercel](https://vercel.com).

### Deployment Steps on Vercel

1. **Import the Git Repository:**
   - Link your GitHub repository in the Vercel dashboard.
2. **Configure Project Settings:**
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Set to `Avtive-Profiles-main`
   - **Build Command:** `npm run build` (or leave default `next build`)
   - **Output Directory:** Leave default (`.next`)
3. **Add Environment Variables:**
   Add each of the required variables from your `.env.local` to the Vercel Project Settings:
   - `MONGODB_URI`
   - `MONGODB_DB_NAME`
   - `SESSION_SECRET`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL` (set to your production domain: `https://your-app.vercel.app`)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` (if using Google OAuth)
   - `SMTP_*` or `RESEND_*` (for email delivery)
4. **Deploy:**
   - Click **Deploy**. Vercel will build and distribute the app globally on the Edge/Serverless network.

---

## 10. Security Notes & Best Practices

- **Protect Environment Secrets:**
  - Never check `.env`, `.env.local`, or configuration files containing real passwords into Git.
  - The repository's `.gitignore` is pre-configured to ignore `.env*` files except `.env.example`.
- **Database IP Access List:**
  - In production, restrict MongoDB Atlas network access to specific static IPs or use VPC peering where applicable. If using serverless platforms like Vercel, use an Atlas username/password with strict role limitations and strong credentials.
- **Cookie Security:**
  - Session and OAuth cookies automatically enforce `HttpOnly: true`, `SameSite: Lax`, and `Secure: true` in production environments (`NODE_ENV === 'production'`).
- **Timing Attack Defense:**
  - Login authentication implements constant-time dummy password comparison to eliminate user enumeration side-channel timing attacks.
- **Asset Upload Sanitization:**
  - All file uploads are verified by binary magic bytes and MIME type inspection before passing to Cloudinary, rejecting unapproved extensions.

---

## License

This project is private and proprietary. All rights reserved.
