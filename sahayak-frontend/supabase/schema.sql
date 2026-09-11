-- SAHAYAK AI Database Schema (PostgreSQL for Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES ENUM
CREATE TYPE user_role AS ENUM ('elderly', 'caregiver', 'family', 'healthcare', 'admin');

-- USERS TABLE (Extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    role user_role DEFAULT 'elderly',
    avatar_url TEXT,
    language_preference TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FAMILY RELATIONSHIPS (Consent & Mapping)
CREATE TABLE public.family_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL, -- e.g., 'grandson', 'daughter'
    can_manage_routines BOOLEAN DEFAULT FALSE,
    can_view_activity BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CAREGIVER ASSIGNMENTS
CREATE TABLE public.caregiver_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{"view_activity": true, "manage_routines": true, "manage_reminders": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- GAMES DIRECTORY
CREATE TABLE public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    game_type TEXT NOT NULL, -- e.g., 'memory_match', 'market_memory'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- GAME SESSIONS (for Analytics & AI Difficulty)
CREATE TABLE public.game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id UUID REFERENCES public.games(id),
    difficulty INTEGER NOT NULL DEFAULT 1,
    score INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 1,
    accuracy FLOAT,
    duration_seconds INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- REMINDERS & ROUTINES
CREATE TABLE public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'medicine', 'hydration', 'meal', 'custom'
    scheduled_time TIME NOT NULL,
    days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Mon, 7=Sun
    is_active BOOLEAN DEFAULT TRUE,
    escalation_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- REMINDER LOGS
CREATE TABLE public.reminder_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reminder_id UUID REFERENCES public.reminders(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- 'delivered', 'acknowledged', 'snoozed', 'missed'
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FAMILY MEMORY VAULT
CREATE TABLE public.family_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',
    date_of_memory DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ROW LEVEL SECURITY (RLS) POLICIES --

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_memories ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile, caregivers/family can read profiles they are assigned to.
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

-- (Further complex RLS policies to be added based on production requirements)
