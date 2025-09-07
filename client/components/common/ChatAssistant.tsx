import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/context/auth";

export default function ChatAssistant() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([
    { role: "ai", text: "Hi! Ask me about schedules, rooms, or availability." },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const localReply = (q: string) => {
    const role = profile?.role;
    const r = (role === "student"
      ? "Next class: ENG-105 at 11:00 in LT-2."
      : role === "teacher"
      ? "You are free at 11:00. Suggested: prepare MAT-202."
      : "Vacant labs today: CSE Lab 2, ECE Lab 1.");
    return `${r}`;
  };

  const send = async () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    try {
      const rolePrefix = profile?.role ? `[${profile.role.toUpperCase()}]` : "";
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${rolePrefix} ${q}`.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data?.text) throw new Error(data?.error || "Gemini error");
      setMessages((m) => [...m, { role: "ai", text: data.text }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", text: localReply(q) }]);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-background/70 backdrop-blur-xl shadow-[0_0_30px_rgba(255,20,147,0.35)]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <div className="text-sm font-semibold">AI Assistant</div>
            <button className="text-pink-400 text-xs hover:underline" onClick={() => setOpen(false)}>Close</button>
          </div>
          <div className="max-h-72 space-y-2 overflow-auto px-3 py-2">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === "ai" ? "text-pink-300" : "text-foreground"}`}>{m.text}</div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              className="h-9 flex-1 rounded-md border border-white/10 bg-background/60 px-2 text-sm outline-none"
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button onClick={send} className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_16px_rgba(255,20,147,0.5)]">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      <button
        className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-tr from-primary to-accent text-white shadow-[0_0_24px_rgba(255,20,147,0.6)]"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle AI Assistant"
      >
        <MessageCircle />
      </button>
    </div>
  );
}
