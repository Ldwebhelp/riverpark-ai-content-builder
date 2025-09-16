-- Riverpark AI Content Builder Database Schema
-- For Supabase PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Processing Jobs table
CREATE TABLE processing_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    categories TEXT[] NOT NULL,
    batch_size INTEGER NOT NULL DEFAULT 25,
    concurrent INTEGER NOT NULL DEFAULT 5,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
    config JSONB NOT NULL,
    progress JSONB NOT NULL DEFAULT '{
        "total": 0,
        "completed": 0,
        "failed": 0,
        "percentage": 0
    }',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing Errors table
CREATE TABLE processing_errors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES processing_jobs(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    error_type TEXT NOT NULL CHECK (error_type IN ('ai-generation', 'validation', 'deployment', 'network')),
    message TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (cache from BigCommerce)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER UNIQUE NOT NULL,
    product_id INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(10,2),
    categories TEXT[],
    description TEXT,
    brand_name TEXT,
    image_url TEXT,
    image_alt TEXT,
    path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated AI Content table
CREATE TABLE ai_generated_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    job_id UUID REFERENCES processing_jobs(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL DEFAULT 'ai-search',
    version TEXT NOT NULL DEFAULT '1.0',
    basic_info JSONB NOT NULL,
    search_keywords TEXT[],
    care_requirements JSONB NOT NULL,
    compatibility JSONB NOT NULL,
    ai_context JSONB NOT NULL,
    related_products JSONB NOT NULL,
    breeding JSONB NOT NULL,
    metadata JSONB NOT NULL,
    validation_score INTEGER CHECK (validation_score >= 0 AND validation_score <= 100),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Progress Updates table (for real-time tracking)
CREATE TABLE job_progress_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES processing_jobs(id) ON DELETE CASCADE,
    current_product TEXT,
    estimated_time_remaining INTEGER, -- seconds
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Validation Results table
CREATE TABLE content_validations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES ai_generated_content(id) ON DELETE CASCADE,
    is_valid BOOLEAN NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    errors JSONB DEFAULT '[]',
    warnings JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_processing_jobs_created_at ON processing_jobs(created_at);
CREATE INDEX idx_processing_errors_job_id ON processing_errors(job_id);
CREATE INDEX idx_processing_errors_error_type ON processing_errors(error_type);
CREATE INDEX idx_products_categories ON products USING GIN(categories);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_ai_content_product_id ON ai_generated_content(product_id);
CREATE INDEX idx_ai_content_job_id ON ai_generated_content(job_id);
CREATE INDEX idx_job_progress_job_id ON job_progress_updates(job_id);
CREATE INDEX idx_job_progress_created_at ON job_progress_updates(created_at);
CREATE INDEX idx_content_validations_content_id ON content_validations(content_id);

-- Enable Row Level Security (RLS)
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_validations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your authentication needs)
-- For demo purposes, allow all operations (in production, implement proper user-based policies)

CREATE POLICY "Allow all operations on processing_jobs" ON processing_jobs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on processing_errors" ON processing_errors
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on products" ON products
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on ai_generated_content" ON ai_generated_content
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on job_progress_updates" ON job_progress_updates
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on content_validations" ON content_validations
    FOR ALL USING (true) WITH CHECK (true);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_processing_jobs_updated_at
    BEFORE UPDATE ON processing_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_generated_content_updated_at
    BEFORE UPDATE ON ai_generated_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW job_summary AS
SELECT
    j.id,
    j.categories,
    j.status,
    j.progress,
    j.started_at,
    j.completed_at,
    COUNT(e.id) as error_count,
    COUNT(c.id) as content_generated
FROM processing_jobs j
LEFT JOIN processing_errors e ON j.id = e.job_id
LEFT JOIN ai_generated_content c ON j.id = c.job_id
GROUP BY j.id, j.categories, j.status, j.progress, j.started_at, j.completed_at;

CREATE VIEW content_summary AS
SELECT
    c.id,
    c.product_id,
    p.name as product_name,
    c.validation_score,
    c.is_approved,
    c.created_at,
    v.score as latest_validation_score
FROM ai_generated_content c
JOIN products p ON c.product_id = p.product_id
LEFT JOIN content_validations v ON c.id = v.content_id
WHERE v.created_at = (
    SELECT MAX(created_at)
    FROM content_validations
    WHERE content_id = c.id
);

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_job_progress(job_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    job_data JSONB;
BEGIN
    SELECT to_jsonb(j.*) INTO job_data
    FROM processing_jobs j
    WHERE j.id = job_uuid;

    RETURN job_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_job_progress(
    job_uuid UUID,
    completed_count INTEGER,
    failed_count INTEGER
) RETURNS VOID AS $$
DECLARE
    total_count INTEGER;
    new_percentage DECIMAL;
BEGIN
    -- Get total count
    SELECT (progress->>'total')::INTEGER INTO total_count
    FROM processing_jobs
    WHERE id = job_uuid;

    -- Calculate percentage
    new_percentage := CASE
        WHEN total_count > 0 THEN (completed_count::DECIMAL / total_count) * 100
        ELSE 0
    END;

    -- Update progress
    UPDATE processing_jobs
    SET progress = jsonb_build_object(
        'total', total_count,
        'completed', completed_count,
        'failed', failed_count,
        'percentage', ROUND(new_percentage, 2)
    ),
    updated_at = NOW()
    WHERE id = job_uuid;
END;
$$ LANGUAGE plpgsql;