-- Embedding System Extension for Slotiफाई
-- This file extends the existing database schema to support embeddings and RAG functionality
-- Run this after your main database-schema.sql

-- Enable the pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table for storing document embeddings
CREATE TABLE IF NOT EXISTS public.embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('course', 'room', 'timetable', 'profile', 'general')),
  content_id uuid, -- Reference to the original record (nullable for general content)
  content_text text NOT NULL, -- The actual text that was embedded
  embedding vector(768), -- 768-dimensional embedding vector (recommended size)
  metadata jsonb DEFAULT '{}', -- Additional metadata about the content
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for embeddings table
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS embeddings_content_type_idx ON public.embeddings (content_type);
CREATE INDEX IF NOT EXISTS embeddings_content_id_idx ON public.embeddings (content_id);
CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON public.embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS Policies for embeddings
CREATE POLICY "embeddings_select_authenticated"
  ON public.embeddings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can manage embeddings directly
CREATE POLICY "embeddings_admin_insert"
  ON public.embeddings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "embeddings_admin_update"
  ON public.embeddings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "embeddings_admin_delete"
  ON public.embeddings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function for semantic search
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(768),
  content_types text[] DEFAULT NULL,
  similarity_threshold float DEFAULT 0.5,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content_type text,
  content_id uuid,
  content_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.content_type,
    e.content_id,
    e.content_text,
    e.metadata,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM public.embeddings e
  WHERE 
    (content_types IS NULL OR e.content_type = ANY(content_types))
    AND 1 - (e.embedding <=> query_embedding) > similarity_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT max_results;
END;
$$;

-- Create function to get embeddings with related data
CREATE OR REPLACE FUNCTION get_content_with_embeddings(
  query_embedding vector(768),
  similarity_threshold float DEFAULT 0.7,
  max_results int DEFAULT 5
)
RETURNS TABLE (
  content_type text,
  content_data jsonb,
  similarity float,
  embedding_text text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH similar_embeddings AS (
    SELECT 
      e.content_type,
      e.content_id,
      e.content_text,
      1 - (e.embedding <=> query_embedding) as similarity
    FROM public.embeddings e
    WHERE 1 - (e.embedding <=> query_embedding) > similarity_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT max_results
  )
  SELECT 
    se.content_type,
    CASE 
      WHEN se.content_type = 'course' THEN (
        SELECT to_jsonb(c.*) 
        FROM public.courses c 
        WHERE c.id = se.content_id
      )
      WHEN se.content_type = 'room' THEN (
        SELECT to_jsonb(r.*) 
        FROM public.rooms r 
        WHERE r.id = se.content_id
      )
      WHEN se.content_type = 'timetable' THEN (
        SELECT jsonb_build_object(
          'timetable', to_jsonb(t.*),
          'course', to_jsonb(c.*),
          'teacher', to_jsonb(p.*),
          'room', to_jsonb(r.*)
        )
        FROM public.timetables t
        LEFT JOIN public.courses c ON c.id = t.course_id
        LEFT JOIN public.profiles p ON p.id = t.teacher_id
        LEFT JOIN public.rooms r ON r.id = t.room_id
        WHERE t.id = se.content_id
      )
      WHEN se.content_type = 'profile' THEN (
        SELECT to_jsonb(p.*) 
        FROM public.profiles p 
        WHERE p.id = se.content_id
      )
      ELSE jsonb_build_object('text', se.content_text)
    END as content_data,
    se.similarity,
    se.content_text
  FROM similar_embeddings se;
END;
$$;

-- Create function for updating embeddings timestamp
CREATE OR REPLACE FUNCTION update_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamps
DROP TRIGGER IF EXISTS update_embeddings_updated_at_trigger ON public.embeddings;
CREATE TRIGGER update_embeddings_updated_at_trigger
  BEFORE UPDATE ON public.embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_embeddings_updated_at();

-- Create view for easy access to embeddings with content
CREATE OR REPLACE VIEW embeddings_with_content AS
SELECT 
  e.id,
  e.content_type,
  e.content_id,
  e.content_text,
  e.metadata,
  e.created_at,
  e.updated_at,
  CASE 
    WHEN e.content_type = 'course' THEN (
      SELECT jsonb_build_object(
        'code', c.code,
        'name', c.name,
        'department', c.department,
        'credits', c.credits,
        'semester', c.semester,
        'year', c.year
      )
      FROM public.courses c WHERE c.id = e.content_id
    )
    WHEN e.content_type = 'room' THEN (
      SELECT jsonb_build_object(
        'room_number', r.room_number,
        'building', r.building,
        'capacity', r.capacity,
        'room_type', r.room_type,
        'facilities', r.facilities
      )
      FROM public.rooms r WHERE r.id = e.content_id
    )
    WHEN e.content_type = 'profile' THEN (
      SELECT jsonb_build_object(
        'name', CONCAT(p.first_name, ' ', p.last_name),
        'role', p.role,
        'department', p.department
      )
      FROM public.profiles p WHERE p.id = e.content_id
    )
    ELSE NULL
  END as related_content
FROM public.embeddings e;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.embeddings TO authenticated;
GRANT SELECT ON public.embeddings_with_content TO authenticated;
GRANT EXECUTE ON FUNCTION search_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_with_embeddings TO authenticated;