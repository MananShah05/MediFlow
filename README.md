# MediFLOW

Intelligent Hospital Management System built for clinical speed, safety, and compliance (DPDP, HIPAA).

---

## 🛠️ Tech Stack

MediFLOW is structured as a TypeScript monorepo managed with **Turborepo** and **pnpm**:

- **Frontend (`apps/web`)**: Next.js 14 (App Router), React, Zustand (in-memory auth), TailwindCSS, Radix UI.
- **Backend (`apps/api`)**: Fastify, Prisma ORM, PostgreSQL, Redis (for queuing), BullMQ, Pino Logger, bcrypt.
- **Shared (`packages/shared`)**: Shared TypeScript schemas (Zod), permissions, vital ranges, and common utilities.
- **Infrastructure**: Docker Compose for orchestrating PostgreSQL 16, Redis, LocalStack (S3 Mock), and ClamAV (malware scanning).

---

## ✨ Features

- **Multi-Tenant Isolation**: Tenant context determined dynamically via subdomains with robust row-level security (RLS) protections.
- **Secure Authentication & Lockout**: Token-based authentication using short-lived in-memory JWTs and HttpOnly cookies, backed by a 5-strike/15-minute account lockout policy.
- **Tamper-Evident Audit Logging**: Cryptographically chained (SHA-256) audit trail of all patient data reads, updates, and accesses.
- **Clinical Workflows**: Includes dedicated portals for Patients, Doctors, Nurses, Administrators, and Platform Super Admins.
- **Consent Management**: Granular patient consent tracking (DPDP-aligned) before clinical data exchange.
- **Bed & Ward Management**: Dynamic layouts, ward occupancy counters, and real-time handoff states.

---

## 🚀 Getting Started

### 1. Install Dependencies
Make sure you have [pnpm](https://pnpm.io/) installed, then run:
```bash
pnpm install
```

### 2. Start Services
Launch the local database, Redis, S3 mock, and ClamAV containers:
```bash
docker compose up -d
```

### 3. Initialize the Database
Generate the Prisma Client and run the database migrations and seed script:
```bash
pnpm --filter @mediflow/api db:generate
pnpm --filter @mediflow/api db:migrate
pnpm --filter @mediflow/api db:seed
```

### 4. Run Development Servers
Start both the API server and Next.js frontend in development mode:
```bash
pnpm dev
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:3001](http://localhost:3001)

---

## 📁 Repository Structure

```
├── apps/
│   ├── api/          # Fastify backend server (routing, plugins, modules)
│   └── web/          # Next.js frontend application (portals, components)
├── packages/
│   └── shared/       # Shared schemas, constants, and types
├── docker/           # Database initialization and mock service configurations
└── docker-compose.yml# Container orchestrations
```
