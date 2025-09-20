/**
 * Embedding API Routes for Slotiफाई
 * Handles embedding generation, search, and RAG functionality
 */

import { RequestHandler } from "express";
import { embeddingService } from "../lib/embedding-service";

export interface EmbeddingGenerationRequest {
  contentTypes?: string[]; // 'course', 'room', 'timetable', 'profile'
  forceRegenerate?: boolean;
}

export interface EmbeddingSearchRequest {
  query: string;
  contentTypes?: string[];
  maxResults?: number;
  similarityThreshold?: number;
}

export interface ChatContextRequest {
  query: string;
  maxResults?: number;
  includeContext?: boolean;
}

/**
 * Generate embeddings for specified content types
 * POST /api/embeddings/generate
 */
export const handleEmbeddingGeneration: RequestHandler = async (req, res) => {
  try {
    const { contentTypes, forceRegenerate }: EmbeddingGenerationRequest = req.body;
    
    console.log('Starting embedding generation...', { contentTypes, forceRegenerate });
    
    const results = {
      courses: 0,
      rooms: 0,
      timetables: 0,
      teachers: 0,
      total: 0
    };

    // If no specific content types requested, embed all
    const typesToEmbed = contentTypes || ['course', 'room', 'timetable', 'profile'];

    try {
      if (typesToEmbed.includes('course')) {
        await embeddingService.embedAllCourses();
        results.courses = 1;
      }
      
      if (typesToEmbed.includes('room')) {
        await embeddingService.embedAllRooms();
        results.rooms = 1;
      }
      
      if (typesToEmbed.includes('timetable')) {
        await embeddingService.embedAllTimetables();
        results.timetables = 1;
      }
      
      if (typesToEmbed.includes('profile')) {
        await embeddingService.embedAllTeachers();
        results.teachers = 1;
      }

      results.total = results.courses + results.rooms + results.timetables + results.teachers;

      res.status(200).json({
        success: true,
        message: `Successfully generated embeddings for ${results.total} content types`,
        data: results
      });

    } catch (embeddingError) {
      console.error('Embedding generation error:', embeddingError);
      res.status(500).json({
        success: false,
        message: 'Error during embedding generation',
        error: embeddingError instanceof Error ? embeddingError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Embedding generation request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process embedding generation request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Search embeddings for similar content
 * POST /api/embeddings/search
 */
export const handleEmbeddingSearch: RequestHandler = async (req, res) => {
  try {
    const { query, contentTypes, maxResults = 10, similarityThreshold = 0.7 }: EmbeddingSearchRequest = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required and cannot be empty'
      });
    }

    console.log('Searching embeddings:', { query, contentTypes, maxResults, similarityThreshold });

    const results = await embeddingService.searchSimilar(
      query.trim(),
      contentTypes,
      similarityThreshold,
      maxResults
    );

    res.status(200).json({
      success: true,
      message: `Found ${results.length} similar results`,
      data: {
        query: query.trim(),
        results,
        count: results.length
      }
    });

  } catch (error) {
    console.error('Embedding search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search embeddings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get contextual information for chat queries
 * POST /api/embeddings/context
 */
export const handleChatContext: RequestHandler = async (req, res) => {
  try {
    const { query, maxResults = 5, includeContext = true }: ChatContextRequest = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required and cannot be empty'
      });
    }

    console.log('Getting chat context:', { query, maxResults });

    const contextData = await embeddingService.getContext(query.trim(), maxResults);

    // Format context for better readability
    const formattedContext = contextData.map(item => {
      const contextText = [];
      
      if (item.content_type === 'course' && item.content_data) {
        contextText.push(`Course: ${item.content_data.code} - ${item.content_data.name}`);
        contextText.push(`Department: ${item.content_data.department}`);
        contextText.push(`Credits: ${item.content_data.credits}`);
        contextText.push(`Semester: ${item.content_data.semester} ${item.content_data.year}`);
      } else if (item.content_type === 'room' && item.content_data) {
        contextText.push(`Room: ${item.content_data.room_number} in ${item.content_data.building}`);
        contextText.push(`Type: ${item.content_data.room_type}`);
        contextText.push(`Capacity: ${item.content_data.capacity}`);
        contextText.push(`Facilities: ${item.content_data.facilities?.join(', ') || 'None'}`);
      } else if (item.content_type === 'timetable' && item.content_data) {
        const tt = item.content_data.timetable;
        const course = item.content_data.course;
        const teacher = item.content_data.teacher;
        const room = item.content_data.room;
        
        contextText.push(`Schedule: ${course?.code} ${course?.name}`);
        contextText.push(`Time: Day ${tt?.day_of_week} from ${tt?.start_time} to ${tt?.end_time}`);
        contextText.push(`Teacher: ${teacher?.first_name} ${teacher?.last_name}`);
        contextText.push(`Room: ${room?.room_number}`);
      } else if (item.content_type === 'profile' && item.content_data) {
        contextText.push(`Teacher: ${item.content_data.name || 'Unknown'}`);
        contextText.push(`Department: ${item.content_data.department || 'Not specified'}`);
        contextText.push(`Role: ${item.content_data.role}`);
      }

      return {
        type: item.content_type,
        similarity: Math.round(item.similarity * 100) / 100,
        content: contextText.join(' | '),
        raw_data: includeContext ? item.content_data : undefined
      };
    });

    res.status(200).json({
      success: true,
      message: `Found ${contextData.length} contextual items`,
      data: {
        query: query.trim(),
        context: formattedContext,
        raw_context: includeContext ? contextData : undefined,
        count: contextData.length
      }
    });

  } catch (error) {
    console.error('Chat context error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat context',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Enhanced Gemini chat with RAG context
 * POST /api/chat/enhanced
 */
export const handleEnhancedChat: RequestHandler = async (req, res) => {
  try {
    const { prompt, useContext = true, maxContextItems = 3 } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Prompt parameter is required and cannot be empty'
      });
    }

    let enhancedPrompt = prompt.trim();
    let contextUsed = [];

    // Get relevant context if requested
    if (useContext) {
      try {
        const contextData = await embeddingService.getContext(prompt.trim(), maxContextItems);
        
        if (contextData.length > 0) {
          const contextTexts = contextData.map(item => item.embedding_text).filter(Boolean);
          
          if (contextTexts.length > 0) {
            const contextSection = contextTexts.join('\n\n');
            enhancedPrompt = `Context from Slotiफाई database:
${contextSection}

Based on the above context and your knowledge, please answer the following question:
${prompt.trim()}

If the context is relevant, use it to provide accurate information about courses, rooms, timetables, or faculty. If the context isn't relevant to the question, answer normally.`;

            contextUsed = contextData.map(item => ({
              type: item.content_type,
              similarity: Math.round(item.similarity * 100) / 100,
              preview: item.embedding_text?.substring(0, 100) + '...'
            }));
          }
        }
      } catch (contextError) {
        console.warn('Could not fetch context, proceeding without it:', contextError);
      }
    }

    // Call Gemini API with enhanced prompt
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false,
        message: "GEMINI_API_KEY not set" 
      });
    }

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: enhancedPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      },
    );

    const data = await resp.json();
    
    if (!resp.ok) {
      return res.status(resp.status).json({ 
        success: false,
        message: data?.error?.message || "Gemini API error" 
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join(" ") || "";

    res.status(200).json({
      success: true,
      message: "Enhanced chat response generated successfully",
      data: {
        text,
        context_used: contextUsed,
        context_count: contextUsed.length,
        original_prompt: prompt.trim(),
        enhanced_prompt_used: useContext && contextUsed.length > 0
      }
    });

  } catch (error) {
    console.error('Enhanced chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate enhanced chat response',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get embedding statistics and health check
 * GET /api/embeddings/stats
 */
export const handleEmbeddingStats: RequestHandler = async (req, res) => {
  try {
    // This would require additional database queries to get stats
    // For now, return a simple response
    res.status(200).json({
      success: true,
      message: "Embedding service is operational",
      data: {
        service_status: "active",
        endpoints_available: [
          "POST /api/embeddings/generate",
          "POST /api/embeddings/search", 
          "POST /api/embeddings/context",
          "POST /api/chat/enhanced",
          "GET /api/embeddings/stats"
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Embedding service error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};