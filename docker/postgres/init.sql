-- MediFLOW PostgreSQL initialization script
-- Enables required extensions for the mediflow_dev database

-- UUID generation (gen_random_uuid is built-in to PG 13+, but uuid-ossp adds more functions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions for PHI column-level encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trigram matching for fuzzy text search (patient name search, drug search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Case-insensitive text type for email/slug comparisons
CREATE EXTENSION IF NOT EXISTS "citext";
