/**
 * Embedding Management Panel for Admin
 * Allows admins to generate, refresh, and monitor embeddings
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  RefreshCw, 
  Search, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Brain,
  Book,
  MapPin,
  Calendar,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmbeddingStats {
  service_status: string;
  endpoints_available: string[];
}

interface GenerationResult {
  courses: number;
  rooms: number;
  timetables: number;
  teachers: number;
  total: number;
}

interface SearchResult {
  type: string;
  similarity: number;
  content: string;
  raw_data?: any;
}

export function EmbeddingManagementPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<EmbeddingStats | null>(null);
  const [lastGeneration, setLastGeneration] = useState<GenerationResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch embedding service stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/embeddings/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Failed to fetch embedding stats:', error);
      toast({
        title: "Error",
        description: "Failed to load embedding service status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Generate embeddings for all content
  const generateAllEmbeddings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentTypes: ['course', 'room', 'timetable', 'profile'],
          forceRegenerate: true
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setLastGeneration(data.data);
        toast({
          title: "Success!",
          description: `Generated embeddings for ${data.data.total} content types`,
        });
      } else {
        throw new Error(data.message || 'Generation failed');
      }
    } catch (error) {
      console.error('Embedding generation failed:', error);
      toast({
        title: "Error",
        description: "Failed to generate embeddings. Check your Gemini API key and database connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate embeddings for specific content type
  const generateSpecificEmbeddings = async (contentType: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentTypes: [contentType],
          forceRegenerate: true
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success!",
          description: `Generated embeddings for ${contentType}`,
        });
      } else {
        throw new Error(data.message || 'Generation failed');
      }
    } catch (error) {
      console.error(`${contentType} embedding generation failed:`, error);
      toast({
        title: "Error",
        description: `Failed to generate ${contentType} embeddings`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Test search functionality
  const testSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch('/api/embeddings/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          maxResults: 5,
          includeContext: true
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data.context || []);
        toast({
          title: "Search Complete",
          description: `Found ${data.data.count} relevant results`,
        });
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Error",
        description: "Search failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return <Book className="h-4 w-4" />;
      case 'room': return <MapPin className="h-4 w-4" />;
      case 'timetable': return <Calendar className="h-4 w-4" />;
      case 'profile': return <Users className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'course': return 'bg-blue-500/20 text-blue-300';
      case 'room': return 'bg-green-500/20 text-green-300';
      case 'timetable': return 'bg-purple-500/20 text-purple-300';
      case 'profile': return 'bg-orange-500/20 text-orange-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-6 w-6 text-pink-400" />
        <h2 className="text-2xl font-bold">Embedding Management</h2>
        <Badge variant="secondary" className="bg-pink-500/20 text-pink-300">
          <Sparkles className="h-3 w-3 mr-1" />
          RAG System
        </Badge>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Service Status
          </CardTitle>
          <CardDescription>
            Monitor the health and status of the embedding service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            {stats?.service_status === 'active' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-medium">Service Active</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-400 font-medium">Service Unavailable</span>
              </>
            )}
          </div>
          
          {stats?.endpoints_available && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Available Endpoints:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {stats.endpoints_available.map((endpoint, index) => (
                  <Badge key={index} variant="outline" className="justify-start">
                    {endpoint}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Embedding Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Generate Embeddings
          </CardTitle>
          <CardDescription>
            Create or refresh embeddings for your database content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Generating embeddings may take several minutes and will use your Gemini API quota. 
              Existing embeddings will be replaced.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={generateAllEmbeddings}
              disabled={loading}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Database className="h-6 w-6" />
              <span>Generate All Embeddings</span>
              <span className="text-xs opacity-70">Courses, Rooms, Timetables, Teachers</span>
            </Button>

            <div className="space-y-2">
              <p className="text-sm font-medium">Generate by Type:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateSpecificEmbeddings('course')}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  <Book className="h-3 w-3" />
                  Courses
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateSpecificEmbeddings('room')}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  Rooms
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateSpecificEmbeddings('timetable')}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  <Calendar className="h-3 w-3" />
                  Timetables
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateSpecificEmbeddings('profile')}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  <Users className="h-3 w-3" />
                  Teachers
                </Button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generating embeddings...</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {lastGeneration && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm font-medium text-green-400 mb-2">Last Generation Results:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>Courses: {lastGeneration.courses}</div>
                <div>Rooms: {lastGeneration.rooms}</div>
                <div>Timetables: {lastGeneration.timetables}</div>
                <div>Teachers: {lastGeneration.teachers}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Test Search
          </CardTitle>
          <CardDescription>
            Test the semantic search functionality with your embeddings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Try: 'computer science courses', 'available labs', 'John Smith teacher'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
              onKeyDown={(e) => e.key === 'Enter' && testSearch()}
            />
            <Button onClick={testSearch} disabled={searchLoading}>
              {searchLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <p className="text-sm font-medium">Search Results:</p>
              <div className="space-y-2 max-h-64 overflow-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 bg-secondary/50 rounded-lg border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className={getContentTypeColor(result.type)}>
                        {getContentTypeIcon(result.type)}
                        <span className="ml-1 capitalize">{result.type}</span>
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(result.similarity * 100)}% match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}