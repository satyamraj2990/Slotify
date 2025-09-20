import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Bot, User, Database, Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "ai" | "user";
  text: string;
  contextUsed?: boolean;
  contextCount?: number;
  timestamp?: Date;
}

interface ContextItem {
  type: string;
  similarity: number;
  preview: string;
}

export default function ChatAssistant() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "ai", 
      text: `Hi ${profile?.first_name || 'there'}! I'm your enhanced AI assistant. I can help you with schedules, courses, rooms, faculty information, and more. I have access to real-time data from your university database!`,
      timestamp: new Date()
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [useEnhancedMode, setUseEnhancedMode] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const localReply = (q: string) => {
    const role = profile?.role;
    const fallbackResponse = role === "student"
      ? "I can help you find your next class, check room availability, or find faculty information. Try asking about specific courses or timetables!"
      : role === "teacher"
      ? "I can help you check your schedule, find available rooms, or get information about courses and students."
      : "I can help you manage timetables, check resource utilization, or get insights about courses and faculty.";
    return fallbackResponse;
  };

  const send = async () => {
    if (!input.trim()) return;
    const q = input.trim();
    const userMessage: Message = { 
      role: "user", 
      text: q, 
      timestamp: new Date() 
    };
    
    setMessages((m) => [...m, userMessage]);
    setInput("");
    setLoading(true);

    try {
      let apiEndpoint = "/api/gemini/generate";
      let requestBody: any = { 
        prompt: q 
      };

      // Use enhanced chat with RAG if enabled
      if (useEnhancedMode) {
        apiEndpoint = "/api/chat/enhanced";
        requestBody = {
          prompt: q,
          useContext: true,
          maxContextItems: 3
        };
      }

      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "API error");
      }

      let responseText = "";
      let contextUsed = false;
      let contextCount = 0;

      if (useEnhancedMode && data?.data) {
        responseText = data.data.text || "I couldn't generate a response.";
        contextUsed = data.data.enhanced_prompt_used || false;
        contextCount = data.data.context_count || 0;
      } else {
        responseText = data?.text || "I couldn't generate a response.";
      }

      const aiMessage: Message = {
        role: "ai",
        text: responseText,
        contextUsed,
        contextCount,
        timestamp: new Date()
      };

      setMessages((m) => [...m, aiMessage]);

    } catch (error) {
      console.error("Chat error:", error);
      
      // Enhanced fallback with more helpful message
      const fallbackMessage: Message = {
        role: "ai",
        text: `I'm experiencing some connectivity issues, but I can still help! ${localReply(q)} You can also try rephrasing your question.`,
        timestamp: new Date()
      };
      
      setMessages((m) => [...m, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[380px] overflow-hidden rounded-2xl border border-white/10 bg-background/80 backdrop-blur-xl shadow-[0_0_30px_rgba(255,20,147,0.35)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Bot className="h-4 w-4 text-pink-400" />
                <span className="text-sm font-semibold">AI Assistant</span>
              </div>
              {useEnhancedMode && (
                <Badge variant="secondary" className="text-xs bg-pink-500/20 text-pink-300">
                  <Database className="h-3 w-3 mr-1" />
                  RAG Enhanced
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseEnhancedMode(!useEnhancedMode)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  useEnhancedMode 
                    ? 'bg-pink-500/20 text-pink-300 hover:bg-pink-500/30' 
                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                }`}
                title={useEnhancedMode ? 'Disable database context' : 'Enable database context'}
              >
                {useEnhancedMode ? <Sparkles className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
              </button>
              <button 
                className="text-pink-400 text-xs hover:underline" 
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="max-h-80 space-y-3 overflow-auto px-4 py-3">
            {messages.map((m, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {m.role === "ai" ? (
                    <>
                      <Bot className="h-3 w-3" />
                      <span>Assistant</span>
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3" />
                      <span>You</span>
                    </>
                  )}
                  {m.timestamp && (
                    <span className="ml-auto">{formatTime(m.timestamp)}</span>
                  )}
                </div>
                
                <div className={`text-sm rounded-lg p-3 ${
                  m.role === "ai" 
                    ? "bg-pink-500/10 text-pink-100 border border-pink-500/20" 
                    : "bg-blue-500/10 text-blue-100 border border-blue-500/20 ml-8"
                }`}>
                  {m.text}
                </div>

                {/* Context indicators */}
                {m.role === "ai" && m.contextUsed && m.contextCount && m.contextCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-pink-400/70">
                    <Database className="h-3 w-3" />
                    <span>Used {m.contextCount} database context{m.contextCount > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex items-center gap-2 text-sm text-pink-300">
                <Bot className="h-4 w-4" />
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs">
                  {useEnhancedMode ? 'Searching database...' : 'Thinking...'}
                </span>
              </div>
            )}
            
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={useEnhancedMode ? "Ask about courses, rooms, schedules..." : "Ask something..."}
                className="h-10 flex-1 rounded-lg border border-white/10 bg-background/60 px-3 text-sm outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50"
                onKeyDown={(e) => e.key === "Enter" && !loading && send()}
                disabled={loading}
              />
              <button 
                onClick={send} 
                disabled={loading || !input.trim()}
                className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_16px_rgba(255,20,147,0.5)] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(255,20,147,0.7)] transition-all"
              >
                <Send size={16} />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>
                {useEnhancedMode ? '🔍 Database-aware responses' : '🤖 Standard AI chat'}
              </span>
              <span className="text-pink-400/70">
                {profile?.role === 'admin' ? '👑 Admin' : profile?.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <button
        className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-tr from-primary to-accent text-white shadow-[0_0_24px_rgba(255,20,147,0.6)] hover:shadow-[0_0_32px_rgba(255,20,147,0.8)] transition-all"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
        {useEnhancedMode && (
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
            <Database className="h-2 w-2 text-white" />
          </div>
        )}
      </button>
    </div>
  );
}
