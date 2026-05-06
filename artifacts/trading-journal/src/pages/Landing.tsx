import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "wouter";
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  PieChart, 
  Globe, 
  ChevronRight, 
  Play, 
  ArrowRight,
  Twitter,
  Mail,
  BarChart3,
  Lock,
  Sparkles,
  Layers,
  Brain,
  Target,
  Calendar,
  BookOpen,
  Award,
  Activity,
  Flame,
  LineChart,
  DollarSign,
  CheckCircle2,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  const handleGoogleLogin = () => {
    toast({
      title: "Signing in with Google",
      description: "Redirecting to Google sign-in...",
    });
    setTimeout(() => {
        setLocation("/signup?mode=google");
    }, 1200);
  };

  const stats = [
    { label: "Trades Tracked", value: "2.4M+", icon: BarChart3 },
    { label: "Active Traders", value: "12K+", icon: TrendingUp },
    { label: "Win Rate Boost", value: "+18%", icon: Target },
    { label: "Countries", value: "85+", icon: Globe },
  ];

  const features = [
    { 
      icon: BarChart3, 
      title: "Smart Analytics", 
      desc: "Automatically track your win rate, profit factor, risk/reward ratio, and dozens of other key trading metrics.",
      color: "from-violet-500 to-purple-600"
    },
    { 
      icon: Brain, 
      title: "AI Trading Coach", 
      desc: "Get personalized insights and recommendations based on your trading patterns. Spot mistakes before they cost you.",
      color: "from-emerald-500 to-cyan-500"
    },
    { 
      icon: Calendar, 
      title: "Performance Calendar", 
      desc: "See your daily P&L at a glance in a beautiful calendar view. Spot your best and worst trading days instantly.",
      color: "from-amber-500 to-orange-500"
    },
    { 
      icon: BookOpen, 
      title: "Trade Journal", 
      desc: "Log emotions, screenshots, and notes for every trade. Build a personal playbook from your winners.",
      color: "from-pink-500 to-rose-500"
    },
    { 
      icon: LineChart, 
      title: "Equity Curve", 
      desc: "Watch your account grow with a real-time equity curve. Track drawdowns and set balance milestones.",
      color: "from-blue-500 to-indigo-500"
    },
    { 
      icon: Target, 
      title: "Custom Playbooks", 
      desc: "Define your trading setups and track which strategies actually make you money. Eliminate the losers.",
      color: "from-teal-500 to-emerald-500"
    },
  ];

  const testimonials = [
    { name: "Marcus R.", role: "Forex Trader", quote: "My win rate went from 52% to 67% in 3 months just by understanding my patterns better.", avatar: "M" },
    { name: "Sarah K.", role: "Options Trader", quote: "The AI insights caught a revenge trading pattern I didn't even know I had. Game changer.", avatar: "S" },
    { name: "David L.", role: "Day Trader", quote: "Best $0 I've ever spent. The free tier alone beat every paid journal I've tried.", avatar: "D" },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 font-sans">
      
      {/* ── Dynamic Ambient Background ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-primary/20 blur-[120px] rounded-full dark:opacity-40 opacity-20 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[100px] rounded-full dark:opacity-30 opacity-10" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.08] mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] sunrise-glow opacity-20 dark:opacity-50" />
      </div>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-5 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-card/40 dark:bg-card/30 backdrop-blur-2xl border border-border/50 rounded-[2rem] px-6 py-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight font-display">Trade<span className="text-primary">Insight</span></span>
          </div>
          
          <div className="hidden lg:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Reviews</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/signup">
              <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-primary text-white border-none rounded-xl px-6 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all h-10">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-48 pb-20 px-6 z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ opacity, scale }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10 backdrop-blur-xl">
             <Sparkles className="w-3.5 h-3.5" />
             Free Forever • No Credit Card Required
          </div>
          
          <h1 className="text-5xl md:text-8xl font-display font-black tracking-tighter leading-[0.95] mb-10 max-w-5xl">
            Your trading journal, <br />
            <span className="gradient-text bg-gradient-to-r from-primary via-purple-500 to-indigo-400">
              supercharged.
            </span>
          </h1>
          
          <p className="max-w-2xl text-base md:text-lg text-muted-foreground mb-12 leading-relaxed font-medium">
            Track your trades, understand your patterns, and boost your win rate with AI-powered insights. The smartest trading journal built for modern traders.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center mb-16">
            <Link href="/signup">
                <Button className="h-16 px-12 bg-foreground text-background hover:bg-foreground/90 text-sm font-black uppercase tracking-widest rounded-2xl group transition-all shadow-2xl">
                Start Trading Smarter
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1.5 transition-transform" />
                </Button>
            </Link>
            
            <button className="h-16 px-10 bg-card/50 border border-border backdrop-blur-xl hover:bg-muted/50 text-foreground text-sm font-black uppercase tracking-widest rounded-2xl flex items-center gap-4 transition-all group">
               <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Play className="w-3.5 h-3.5 text-primary fill-primary ml-0.5" />
               </div>
               Watch Demo
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-28">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-black tracking-tight">{stat.value}</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Dashboard Preview ── */}
        <motion.div
           initial={{ opacity: 0, y: 120, rotateX: 10 }}
           whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
           className="relative max-w-6xl w-full mx-auto"
        >
          <div className="relative rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 bg-card/50 backdrop-blur-3xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] group">
             {/* Preview Header */}
             <div className="h-14 border-b border-border/40 px-8 flex items-center justify-between bg-muted/20">
                <div className="flex gap-2.5">
                   <div className="w-3 h-3 rounded-full bg-rose-500/30" />
                   <div className="w-3 h-3 rounded-full bg-amber-500/30" />
                   <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
                </div>
                <div className="h-6 w-56 bg-muted/40 rounded-full border border-border/30 flex items-center px-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                   <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">TradeInsight Dashboard</span>
                </div>
                <Layers className="w-4 h-4 text-muted-foreground/30" />
             </div>

             {/* Preview Content Mockup */}
             <div className="p-10 grid grid-cols-12 gap-6 min-h-[550px]">
                {/* Top Metrics Row */}
                <div className="col-span-12 grid grid-cols-5 gap-4">
                  {[
                    { label: "Net P&L", value: "+$14,284", color: "text-emerald-500" },
                    { label: "Win Rate", value: "68.4%", color: "text-foreground" },
                    { label: "Profit Factor", value: "2.41", color: "text-foreground" },
                    { label: "Trades", value: "147", color: "text-foreground" },
                    { label: "Best Streak", value: "12W", color: "text-emerald-500" },
                  ].map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="rounded-[2rem] border-2 border-slate-100 dark:border-white/5 bg-card p-5"
                    >
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{m.label}</p>
                      <p className={`text-2xl font-black tracking-tight ${m.color}`}>{m.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Equity Chart */}
                <div className="col-span-8 rounded-[2rem] border-2 border-slate-100 dark:border-white/5 bg-card p-8 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Equity Curve</p>
                      <p className="text-2xl font-black text-emerald-500">+$14,284.12</p>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                       +12.4% this month
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1/2">
                     <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                        <motion.path 
                           initial={{ pathLength: 0 }}
                           whileInView={{ pathLength: 1 }}
                           transition={{ duration: 2.5, delay: 0.8 }}
                           d="M0,90 Q150,85 300,60 T600,45 T800,10 T1000,5" 
                           fill="none" 
                           stroke="hsl(var(--profit))" 
                           strokeWidth="4" 
                           strokeLinecap="round"
                        />
                        <path d="M0,90 Q150,85 300,60 T600,45 T800,10 T1000,5" fill="url(#pnlGrad)" opacity="0.1" />
                        <defs>
                           <linearGradient id="pnlGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="hsl(var(--profit))" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                     </svg>
                  </div>
                </div>

                {/* AI Coach Card */}
                <div className="col-span-4 rounded-[2rem] border-2 border-primary/20 bg-primary/[0.03] p-8 flex flex-col items-start justify-center gap-5 relative overflow-hidden">
                   <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                   <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Brain className="w-7 h-7 text-primary" />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[11px] font-black text-primary uppercase tracking-[0.15em]">AI Trading Coach</p>
                      <p className="text-lg font-bold leading-tight">Spot your best setups and eliminate costly mistakes.</p>
                   </div>
                   <div className="w-full h-10 bg-card rounded-xl border border-border flex items-center px-4 gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Analyzing your patterns...</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Floating glow */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-[120px] pointer-events-none" 
          />
        </motion.div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-24">
             <div className="px-4 py-1.5 rounded-full bg-muted/30 border border-border text-xs font-black uppercase tracking-widest mb-6 backdrop-blur-xl">
                Everything You Need
             </div>
             <h2 className="text-4xl md:text-5xl font-display font-black tracking-tighter mb-6">Built for serious traders.</h2>
             <p className="text-muted-foreground max-w-xl text-lg">Stop guessing. Start understanding your patterns, improving your edge, and growing your account.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="p-8 rounded-[2rem] bg-card border-2 border-slate-100 dark:border-white/5 relative group overflow-hidden transition-all duration-500"
              >
                <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity`} />
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-display font-black mb-3 tracking-tight">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-32 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center mb-20">
            <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-black uppercase tracking-widest mb-6 text-primary">
              Simple Setup
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-black tracking-tighter mb-6">Start in 30 seconds.</h2>
            <p className="text-muted-foreground max-w-xl text-lg">No complicated setup. Just sign up, log your first trade, and let the insights flow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Your Account", desc: "Sign up free with Google or email. No credit card needed, no catch.", icon: Sparkles },
              { step: "02", title: "Log Your Trades", desc: "Import from MT5 or add trades manually. We handle all the number crunching.", icon: BookOpen },
              { step: "03", title: "Get Smarter", desc: "Review AI insights, track your progress, and watch your win rate climb.", icon: TrendingUp },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative p-8 rounded-[2rem] bg-card border-2 border-slate-100 dark:border-white/5 text-center group"
              >
                <div className="text-7xl font-black text-primary/10 absolute top-4 right-6">{s.step}</div>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary group-hover:scale-110 transition-transform">
                  <s.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black mb-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-32 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-20">
            <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-black uppercase tracking-widest mb-6 text-amber-600 dark:text-amber-400">
              Trader Reviews
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-black tracking-tighter mb-6">Loved by traders worldwide.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2rem] bg-card border-2 border-slate-100 dark:border-white/5 flex flex-col gap-6"
              >
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[3rem] bg-gradient-to-br from-violet-600 to-purple-700 p-16 text-center text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-5xl font-display font-black tracking-tighter">Ready to level up your trading?</h2>
              <p className="text-white/70 text-lg max-w-xl mx-auto">Join thousands of traders who improved their win rate, cut their losses, and finally achieved consistency.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button className="h-14 px-10 bg-white text-violet-700 hover:bg-white/90 font-black rounded-2xl text-sm uppercase tracking-widest shadow-2xl border-none">
                    Create Free Account
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-6 text-white/50 text-xs font-bold">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Free forever</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Setup in 30 seconds</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-20 border-t border-border/40 relative z-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-6 text-center max-w-2xl">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-primary" />
              <span className="font-black text-xl tracking-tight font-display">Trade<span className="text-primary">Insight</span></span>
            </div>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-md">
              The smartest trading journal for forex, stocks, crypto, and options traders. Track, analyze, and improve your performance.
            </p>
            <div className="flex items-center gap-8 text-muted-foreground/60">
               <Twitter className="w-5 h-5 hover:text-primary cursor-pointer transition-all" />
               <Mail className="w-5 h-5 hover:text-primary cursor-pointer transition-all" />
            </div>
          </div>
          
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <div className="w-full flex flex-col md:flex-row justify-between items-center text-[10px] uppercase font-bold tracking-wider text-muted-foreground/40 gap-4">
             <div className="flex items-center gap-8">
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-primary transition-colors">Contact</a>
             </div>
             <span>© 2026 TradeInsight. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
