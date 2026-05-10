import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, Brain, Zap, Maximize2, Minimize2, MessageSquare, ImageIcon, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { customFetch } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm your TradeInsight AI coach. How can I help you improve your trading performance today?" }
  ]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage: Message = { 
      role: "user", 
      content: input || (selectedImage ? "Please analyze this chart." : ""),
      image: selectedImage || undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const data = await customFetch<{ content: string }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage.content,
          image: userMessage.image,
          history: messages.slice(-10)
        }),
      });

      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `I'm having trouble: ${err.message || "Connection failed"}. Please check your AI settings.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center overflow-hidden transition-all",
          isOpen ? "opacity-0 pointer-events-none scale-0" : "opacity-100 scale-100"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-purple-500 to-indigo-500 animate-pulse opacity-50" />
        <MessageSquare className="w-8 h-8 relative z-10" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 w-[450px] h-[650px] max-h-[85vh] bg-card border border-border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[32px] overflow-hidden flex flex-col backdrop-blur-3xl"
          >
            <div className="p-6 bg-muted/20 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Insight AI</h3>
                  <div className="flex items-center gap-1.5 ">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Vision Protocol Active</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar h-full">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                  {m.image && (
                    <img src={m.image} alt="Uploaded chart" className="max-w-[200px] rounded-xl mb-2 border border-border/50 shadow-lg" />
                  )}
                  <div className={cn(
                    "max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
                    m.role === "user" 
                      ? "bg-primary text-white shadow-primary/10 rounded-tr-none" 
                      : "bg-muted/40 border border-border/50 text-foreground rounded-tl-none"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted/30 border border-border p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-muted/10 border-t border-border space-y-4">
              {selectedImage && (
                <div className="relative w-20 h-20 group">
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-cover rounded-xl border-2 border-primary" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              <div className="relative flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 rounded-xl shrink-0 border-border bg-background"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </Button>
                
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Ask about price action or strategy..."
                    className="w-full h-12 bg-background border border-border rounded-xl px-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={(!input.trim() && !selectedImage) || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-center text-muted-foreground/40 font-bold uppercase tracking-widest">
                Vision Engine v1.2 • Gemini Multimodal
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
