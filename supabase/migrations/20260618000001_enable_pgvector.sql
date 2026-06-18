-- Enable the pgvector extension for vector similarity search.
-- This must run before any migration that creates vector columns.

CREATE EXTENSION IF NOT EXISTS vector;
