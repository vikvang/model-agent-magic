-- Schema for Gregify Supabase database
-- Run these SQL commands in Supabase SQL Editor to set up the database schema

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- User API keys table - Note: we're updating this to reference auth.users directly
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    openai_api_key TEXT,
    deepseek_api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT user_api_keys_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Prompt history table
CREATE TABLE IF NOT EXISTS public.prompt_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    original_prompt TEXT NOT NULL,
    enhanced_prompt TEXT NOT NULL,
    role TEXT NOT NULL,
    success BOOLEAN DEFAULT true,
    model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS prompt_history_user_id_idx ON public.prompt_history(user_id);
CREATE INDEX IF NOT EXISTS user_api_keys_user_id_idx ON public.user_api_keys(user_id);

-- Enable RLS on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY users_policy ON public.users
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Users can only see their own prompt history
CREATE POLICY prompt_history_select_policy ON public.prompt_history
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can only insert their own prompt history
CREATE POLICY prompt_history_insert_policy ON public.prompt_history
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can only see and modify their own API keys
CREATE POLICY user_api_keys_policy ON public.user_api_keys
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create a secure function for user registration that hashes passwords
-- This is typically handled by Supabase Auth, but included here for completeness
CREATE OR REPLACE FUNCTION public.register_user(
    email TEXT,
    password TEXT,
    name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO public.users (email, password_hash, name)
    VALUES (email, crypt(password, gen_salt('bf')), name)
    RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to record prompt history
CREATE OR REPLACE FUNCTION public.record_prompt_history(
    p_user_id UUID,
    p_original_prompt TEXT,
    p_enhanced_prompt TEXT,
    p_role TEXT,
    p_success BOOLEAN DEFAULT true,
    p_model TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    new_history_id UUID;
BEGIN
    INSERT INTO public.prompt_history (
        user_id, 
        original_prompt, 
        enhanced_prompt, 
        role, 
        success, 
        model
    )
    VALUES (
        p_user_id, 
        p_original_prompt, 
        p_enhanced_prompt, 
        p_role, 
        p_success, 
        p_model
    )
    RETURNING id INTO new_history_id;
    
    RETURN new_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to save user API keys
CREATE OR REPLACE FUNCTION public.save_user_api_keys(
    p_user_id UUID,
    p_openai_api_key TEXT DEFAULT NULL,
    p_deepseek_api_key TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    existing_id UUID;
    new_id UUID;
BEGIN
    -- Check if the user already has an API keys entry
    SELECT id INTO existing_id FROM public.user_api_keys WHERE user_id = p_user_id;
    
    IF existing_id IS NOT NULL THEN
        -- Update existing record
        UPDATE public.user_api_keys
        SET 
            openai_api_key = COALESCE(p_openai_api_key, openai_api_key),
            deepseek_api_key = COALESCE(p_deepseek_api_key, deepseek_api_key),
            updated_at = now()
        WHERE id = existing_id;
        
        RETURN existing_id;
    ELSE
        -- Insert new record
        INSERT INTO public.user_api_keys (
            user_id,
            openai_api_key,
            deepseek_api_key
        )
        VALUES (
            p_user_id,
            p_openai_api_key,
            p_deepseek_api_key
        )
        RETURNING id INTO new_id;
        
        RETURN new_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 