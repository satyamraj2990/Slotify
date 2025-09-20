/**
 * Embedding Service for Slotiफाई
 * Handles generation and management of embeddings for RAG system
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import type { Course, Room, Timetable, Profile } from '../../shared/api';

// Initialize Google AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize Supabase client for server operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for embedding service');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface EmbeddingRecord {
  id?: string;
  content_type: 'course' | 'room' | 'timetable' | 'profile' | 'general';
  content_id?: string;
  content_text: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  content_type: string;
  content_id: string;
  content_text: string;
  metadata: Record<string, any>;
  similarity: number;
}

export class EmbeddingService {
  private model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Google AI expects just the text for embedContent
      const result = await this.model.embedContent(text);
      
      if (!result.embedding || !result.embedding.values) {
        throw new Error('No embedding values returned');
      }
      
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(texts: string[], taskType: string = 'SEMANTIC_SIMILARITY'): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];
      
      // Process in smaller batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map(text => this.generateEmbedding(text));
        const batchResults = await Promise.all(batchPromises);
        embeddings.push(...batchResults);
        
        // Add small delay between batches to respect rate limits
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return embeddings;
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Convert course data to searchable text
   */
  courseToText(course: Course): string {
    return `Course: ${course.code} - ${course.name}. Department: ${course.department}. Credits: ${course.credits}. Type: ${course.course_type}. Semester: ${course.semester} ${course.year}. Theory/Practical: ${course.theory_practical || 'Not specified'}. Max students: ${course.max_students}.`;
  }

  /**
   * Convert room data to searchable text
   */
  roomToText(room: Room): string {
    const facilities = room.facilities?.join(', ') || 'None';
    return `Room: ${room.room_number} in ${room.building}. Type: ${room.room_type}. Capacity: ${room.capacity} students. Facilities: ${facilities}. Available: ${room.is_available ? 'Yes' : 'No'}.`;
  }

  /**
   * Convert timetable data to searchable text
   */
  timetableToText(timetable: Timetable): string {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[timetable.day_of_week] || 'Unknown';
    
    return `Timetable entry: ${timetable.course?.code} ${timetable.course?.name} on ${dayName} from ${timetable.start_time} to ${timetable.end_time}. Room: ${timetable.room?.room_number}. Teacher: ${timetable.teacher?.first_name} ${timetable.teacher?.last_name}. Semester: ${timetable.semester} ${timetable.year}.`;
  }

  /**
   * Convert profile data to searchable text
   */
  profileToText(profile: Profile): string {
    const subjects = profile.subjects?.join(', ') || 'Not specified';
    return `${profile.role}: ${profile.first_name} ${profile.last_name}. Department: ${profile.department || 'Not specified'}. Email: ${profile.email}. Subjects: ${subjects}. Availability: ${profile.availability || 'Not specified'}.`;
  }

  /**
   * Store embedding in database
   */
  async storeEmbedding(embeddingRecord: EmbeddingRecord): Promise<void> {
    try {
      const { error } = await supabase
        .from('embeddings')
        .insert([{
          content_type: embeddingRecord.content_type,
          content_id: embeddingRecord.content_id,
          content_text: embeddingRecord.content_text,
          embedding: embeddingRecord.embedding,
          metadata: embeddingRecord.metadata || {}
        }]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error storing embedding:', error);
      throw error;
    }
  }

  /**
   * Store multiple embeddings in batch
   */
  async storeBatchEmbeddings(embeddingRecords: EmbeddingRecord[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('embeddings')
        .insert(embeddingRecords.map(record => ({
          content_type: record.content_type,
          content_id: record.content_id,
          content_text: record.content_text,
          embedding: record.embedding,
          metadata: record.metadata || {}
        })));

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error storing batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Search for similar content using embeddings
   */
  async searchSimilar(
    queryText: string, 
    contentTypes?: string[], 
    similarityThreshold: number = 0.7,
    maxResults: number = 5
  ): Promise<SearchResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(queryText);

      // Search in database
      const { data, error } = await supabase.rpc('search_embeddings', {
        query_embedding: queryEmbedding,
        content_types: contentTypes,
        similarity_threshold: similarityThreshold,
        max_results: maxResults
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error searching embeddings:', error);
      throw error;
    }
  }

  /**
   * Get contextual information for a query
   */
  async getContext(queryText: string, maxResults: number = 5): Promise<any[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(queryText);

      const { data, error } = await supabase.rpc('get_content_with_embeddings', {
        query_embedding: queryEmbedding,
        similarity_threshold: 0.6,
        max_results: maxResults
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting context:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for all courses
   */
  async embedAllCourses(): Promise<void> {
    try {
      console.log('Starting to embed all courses...');
      
      // Fetch all courses
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*');

      if (error) throw error;
      if (!courses || courses.length === 0) {
        console.log('No courses found to embed');
        return;
      }

      // Clear existing course embeddings
      await supabase
        .from('embeddings')
        .delete()
        .eq('content_type', 'course');

      // Convert courses to text and generate embeddings
      const courseTexts = courses.map(course => this.courseToText(course));
      const embeddings = await this.generateBatchEmbeddings(courseTexts, 'RETRIEVAL_DOCUMENT');

      // Prepare embedding records
      const embeddingRecords: EmbeddingRecord[] = courses.map((course, index) => ({
        content_type: 'course',
        content_id: course.id,
        content_text: courseTexts[index],
        embedding: embeddings[index],
        metadata: {
          department: course.department,
          semester: course.semester,
          year: course.year,
          course_type: course.course_type
        }
      }));

      // Store embeddings in batches
      const batchSize = 50;
      for (let i = 0; i < embeddingRecords.length; i += batchSize) {
        const batch = embeddingRecords.slice(i, i + batchSize);
        await this.storeBatchEmbeddings(batch);
      }

      console.log(`Successfully embedded ${courses.length} courses`);
    } catch (error) {
      console.error('Error embedding courses:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for all rooms
   */
  async embedAllRooms(): Promise<void> {
    try {
      console.log('Starting to embed all rooms...');
      
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select('*');

      if (error) throw error;
      if (!rooms || rooms.length === 0) {
        console.log('No rooms found to embed');
        return;
      }

      // Clear existing room embeddings
      await supabase
        .from('embeddings')
        .delete()
        .eq('content_type', 'room');

      const roomTexts = rooms.map(room => this.roomToText(room));
      const embeddings = await this.generateBatchEmbeddings(roomTexts, 'RETRIEVAL_DOCUMENT');

      const embeddingRecords: EmbeddingRecord[] = rooms.map((room, index) => ({
        content_type: 'room',
        content_id: room.id,
        content_text: roomTexts[index],
        embedding: embeddings[index],
        metadata: {
          building: room.building,
          room_type: room.room_type,
          capacity: room.capacity,
          facilities: room.facilities
        }
      }));

      await this.storeBatchEmbeddings(embeddingRecords);
      console.log(`Successfully embedded ${rooms.length} rooms`);
    } catch (error) {
      console.error('Error embedding rooms:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for all active timetables
   */
  async embedAllTimetables(): Promise<void> {
    try {
      console.log('Starting to embed all timetables...');
      
      const { data: timetables, error } = await supabase
        .from('timetables')
        .select(`
          *,
          course:courses(*),
          teacher:profiles!timetables_teacher_id_fkey(*),
          room:rooms(*)
        `)
        .eq('is_active', true);

      if (error) throw error;
      if (!timetables || timetables.length === 0) {
        console.log('No timetables found to embed');
        return;
      }

      // Clear existing timetable embeddings
      await supabase
        .from('embeddings')
        .delete()
        .eq('content_type', 'timetable');

      const timetableTexts = timetables.map(timetable => this.timetableToText(timetable));
      const embeddings = await this.generateBatchEmbeddings(timetableTexts, 'RETRIEVAL_DOCUMENT');

      const embeddingRecords: EmbeddingRecord[] = timetables.map((timetable, index) => ({
        content_type: 'timetable',
        content_id: timetable.id,
        content_text: timetableTexts[index],
        embedding: embeddings[index],
        metadata: {
          semester: timetable.semester,
          year: timetable.year,
          day_of_week: timetable.day_of_week,
          course_code: timetable.course?.code,
          teacher_name: `${timetable.teacher?.first_name} ${timetable.teacher?.last_name}`,
          room_number: timetable.room?.room_number
        }
      }));

      await this.storeBatchEmbeddings(embeddingRecords);
      console.log(`Successfully embedded ${timetables.length} timetables`);
    } catch (error) {
      console.error('Error embedding timetables:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for all teachers
   */
  async embedAllTeachers(): Promise<void> {
    try {
      console.log('Starting to embed all teachers...');
      
      const { data: teachers, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher');

      if (error) throw error;
      if (!teachers || teachers.length === 0) {
        console.log('No teachers found to embed');
        return;
      }

      // Clear existing teacher embeddings
      await supabase
        .from('embeddings')
        .delete()
        .eq('content_type', 'profile');

      const teacherTexts = teachers.map(teacher => this.profileToText(teacher));
      const embeddings = await this.generateBatchEmbeddings(teacherTexts, 'RETRIEVAL_DOCUMENT');

      const embeddingRecords: EmbeddingRecord[] = teachers.map((teacher, index) => ({
        content_type: 'profile',
        content_id: teacher.id,
        content_text: teacherTexts[index],
        embedding: embeddings[index],
        metadata: {
          role: teacher.role,
          department: teacher.department,
          subjects: teacher.subjects
        }
      }));

      await this.storeBatchEmbeddings(embeddingRecords);
      console.log(`Successfully embedded ${teachers.length} teachers`);
    } catch (error) {
      console.error('Error embedding teachers:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for all content types
   */
  async embedAllContent(): Promise<void> {
    try {
      console.log('Starting to embed all content...');
      
      await Promise.all([
        this.embedAllCourses(),
        this.embedAllRooms(),
        this.embedAllTimetables(),
        this.embedAllTeachers()
      ]);

      console.log('Successfully embedded all content!');
    } catch (error) {
      console.error('Error embedding all content:', error);
      throw error;
    }
  }
}

export const embeddingService = new EmbeddingService();