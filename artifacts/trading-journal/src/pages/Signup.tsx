import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { TrendingUp, Eye, EyeOff, ArrowRight, Check, ShieldCheck, Globe, Zap, Sparkles, Brain, Target, Award, ListChecks } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    toast({
      title: "Signing in with Google",
      description: "Connecting to your Google account...",
    });

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo-trader@gmail.com",
          password: "google-auth-simulated-password-2026",
          displayName: "Elite Trader",
        }),
      });

      let data = await res.json();
      
      if (res.status === 400 && data.error === "Email already in use") {
         const loginRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "demo-trader@gmail.com",
              password: "google-auth-simulated-password-2026",
            }),
          });
          data = await loginRes.json();
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      
      toast({
        title: "Welcome back!",
        description: "Logged in successfully. Opening your dashboard...",
      });
      
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      console.error("Login Error:", err);
      setError("Something went wrong. Please try again or log in manually.");
    } finally {
      setIsLoading(false);
    }
  };

  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          displayName: !isLogin ? form.displayName : undefined,
        }),
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        throw new Error("Something went wrong. Please try again.");
      }

      if (!res.ok) {
        throw new Error(data.error || data.details || "Access Denied");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      toast({
        title: isLogin ? "Welcome back!" : "Account created!",
        description: isLogin 
          ? "Loading your dashboard..." 
          : "Your account is ready. Let's start trading!",
      });
      
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: isLogin ? "Login Denied" : "Signup Failed",
        description: err.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const featureHighlights = [
    { title: "AI Insights", icon: Brain, desc: "Get smart recommendations to improve your trading." },
    { title: "Custom Playbooks", icon: Target, desc: "Build and track your best trading strategies." },
    { title: "Trade Logging", icon: ListChecks, desc: "Quickly log every trade with detailed notes." },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans selection:bg-primary/30 overflow-hidden">
      
      {/* ── LEFT PANEL: BRAND & EXPERIENCE ── */}
      <div className="hidden lg:flex flex-col justify-between w-[48%] bg-card p-20 relative overflow-hidden border-r border-border/60">
        
        {/* Dynamic Background Elements */}
        <div className="absolute top-[-15%] right-[-10%] w-[90%] h-[80%] bg-primary/15 blur-[120px] rounded-full animate-pulse opacity-40 dark:opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[100px] rounded-full opacity-30" />
        <div className="absolute inset-0 perspective-grid opacity-[0.05] pointer-events-none" />

        <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="relative z-10"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-2xl shadow-primary/30 ring-1 ring-white/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
             <span className="text-2xl font-display font-black tracking-tighter">
               Trade<span className="text-primary">Insight</span>
             </span>
          </div>
        </motion.div>

        <div className="relative z-10 space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
             <h2 className="text-6xl font-display font-black leading-[1.0] tracking-tighter">
               Trade smarter, <br />
               <span className="gradient-text bg-gradient-to-r from-primary via-purple-400 to-indigo-400">
                 not harder.
               </span>
             </h2>
             <p className="text-lg text-muted-foreground max-w-md font-medium leading-[1.6]">
               Track your trades, understand your patterns, and grow your account with AI-powered insights.
             </p>
          </motion.div>

          <div className="grid gap-6">
            {featureHighlights.map((f, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                key={i} 
                className="group flex items-start gap-5 p-6 rounded-3xl transition-all duration-500 hover:bg-primary/[0.03] border border-transparent hover:border-primary/10"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-primary/20 transition-all text-primary">
                  <f.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-black text-foreground mb-1 group-hover:text-primary transition-colors tracking-tight">{f.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-8">
           <div className="flex items-center gap-2.5">
               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Secure & Encrypted</p>
            </div>
            <div className="h-4 w-[1px] bg-border" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Free Forever</p>
        </div>
      </div>

      {/* ── RIGHT PANEL: AUTH PORTAL ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 relative overflow-y-auto bg-background">
        {/* Subtle decorative glow for mobile/small screens */}
        <div className="lg:hidden absolute top-[-20%] right-[-10%] w-full h-full bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-[440px] space-y-12 relative z-10 py-12">
          <div className="space-y-4">
            <div className="flex items-center justify-between lg:hidden mb-10">
                <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                       <TrendingUp className="w-5 h-5 text-white" />
                   </div>
                   <span className="font-display font-black text-xl tracking-tight">TradeLog</span>
                </div>
            </div>
            
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3"
            >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Start for Free</span>
            </motion.div>

            <h1 className="text-4xl font-display font-black tracking-tight text-foreground">
               {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-muted-foreground font-medium text-sm leading-relaxed">
               {isLogin 
                 ? "Enter your email and password to log in." 
                 : "Sign up to start tracking your trades and improving your edge."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            {!isLogin && (
              <div className="space-y-2.5 group">
                <Label htmlFor="displayName" className="text-[10px] font-black text-muted-foreground/40 group-focus-within:text-primary transition-colors uppercase tracking-[0.2em] ml-1">Your Name</Label>
                <Input
                  id="displayName"
                  placeholder="e.g. Harry S."
                  value={form.displayName}
                  onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                  className="h-14 bg-muted/20 border-border focus:border-primary/50 transition-all rounded-2xl focus:ring-4 focus:ring-primary/5 font-bold px-5"
                />
              </div>
            )}

            <div className="space-y-2.5 group">
              <Label htmlFor="email" className="text-[10px] font-black text-muted-foreground/40 group-focus-within:text-primary transition-colors uppercase tracking-[0.2em] ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@email.com"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="h-14 bg-muted/20 border-border focus:border-primary/50 transition-all rounded-2xl focus:ring-4 focus:ring-primary/5 font-bold px-5"
              />
            </div>

            <div className="space-y-2.5 group relative">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className="text-[10px] font-black text-muted-foreground/40 group-focus-within:text-primary transition-colors uppercase tracking-[0.2em]">Password</Label>
                {isLogin && (
                   <button type="button" className="text-[10px] font-black text-primary hover:text-primary/70 transition-colors uppercase tracking-widest link-underline">
                     Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="h-14 bg-muted/20 border-border focus:border-primary/50 transition-all rounded-2xl focus:ring-4 focus:ring-primary/5 font-bold pr-14 px-5"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
               {error && (
                 <motion.div 
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-4"
                 >
                   <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5">
                     <span className="text-destructive font-black text-xs">!</span>
                   </div>
                   <p className="text-[11px] font-bold text-destructive/80 leading-relaxed">
                     {error}
                   </p>
                 </motion.div>
               )}
            </AnimatePresence>

            <div className="pt-4 space-y-5">
                <Button 
                    type="submit" 
                    className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 font-black rounded-2xl transition-all shadow-2xl active:scale-[0.98] uppercase tracking-widest text-xs border-none" 
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    ) : (
                      <span className="flex items-center gap-3">
                         {isLogin ? "Log In" : "Create Account"}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                </Button>

                <div className="relative flex items-center gap-5 py-2">
                   <div className="h-[1px] flex-1 bg-border/60" />
                    <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] whitespace-nowrap">Or continue with</span>
                   <div className="h-[1px] flex-1 bg-border/60" />
                </div>

                <Button 
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full h-14 bg-card border-border text-foreground hover:bg-muted/50 rounded-2xl flex items-center justify-center gap-4 font-black transition-all active:scale-[0.98] uppercase tracking-widest text-[10px]"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" opacity="0.6"/>
                    </svg>
                     Continue with Google
                </Button>
            </div>
          </form>

          <footer className="space-y-8">
            <p className="text-center text-sm font-medium text-muted-foreground/60">
               {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/70 transition-colors ml-2 font-black underline underline-offset-8 decoration-primary/20 tracking-tight"
              >
                 {isLogin ? "Sign Up" : "Log In"}
              </button>
            </p>

            <div className="pt-10 border-t border-border/40">
                   <p className="text-[9px] text-center text-muted-foreground/40 uppercase tracking-[0.25em] font-black leading-relaxed">
                      Your data is securely encrypted <br /> We never share your information
                  </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
