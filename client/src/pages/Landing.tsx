import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { DatabaseZap, Sparkles, Database, History, Lock, Code2, Globe } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DatabaseZap className="w-7 h-7 text-primary" />
            <span className="font-bold text-xl tracking-tight">SQL Studio</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <span className="cursor-not-allowed opacity-70">Pricing (Soon)</span>
            <span className="cursor-not-allowed opacity-70">Docs (Soon)</span>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
              Login
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background z-0" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Generate SQL with AI in Seconds
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Stop wrestling with complex JOINs and nested subqueries. Describe what you need in plain English, and let our AI build production-ready, highly optimized SQL instantly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link to="/register">
                  <Button size="lg" className="h-12 px-8 text-base font-semibold w-full sm:w-auto">
                    Start Free
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold w-full sm:w-auto">
                  View Demo
                </Button>
              </div>
            </motion.div>
            
            {/* Dashboard Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-16 mx-auto max-w-5xl rounded-xl border border-border/50 bg-card/50 shadow-2xl overflow-hidden backdrop-blur-sm"
            >
              <div className="h-10 border-b border-border/50 bg-muted/50 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="p-4 sm:p-8 grid md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4">
                  <div className="h-32 rounded-lg bg-muted/50 border border-border/50 p-4 flex flex-col justify-center">
                    <span className="text-muted-foreground font-mono text-sm">
                      "Get the top 5 highest paying customers this month across all international regions."
                    </span>
                  </div>
                </div>
                <div className="h-48 rounded-lg bg-[#0d1117] border border-border/50 p-4 overflow-hidden">
                  <pre className="text-sm text-slate-300 font-mono">
                    <span className="text-purple-400">SELECT</span> c.id, c.name, <span className="text-purple-400">SUM</span>(o.amount)<br/>
                    <span className="text-purple-400">FROM</span> customers c<br/>
                    <span className="text-purple-400">JOIN</span> orders o <span className="text-purple-400">ON</span> c.id = o.customer_id<br/>
                    <span className="text-purple-400">WHERE</span> o.created_at {'>='} <span className="text-green-400">'2023-11-01'</span><br/>
                    <span className="text-purple-400">GROUP BY</span> c.id, c.name<br/>
                    <span className="text-purple-400">ORDER BY</span> <span className="text-purple-400">SUM</span>(o.amount) <span className="text-purple-400">DESC</span><br/>
                    <span className="text-purple-400">LIMIT</span> 5;
                  </pre>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you need to master SQL</h2>
              <p className="text-muted-foreground text-lg">A complete toolkit for developers, data analysts, and product managers to work with databases faster.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Sparkles, title: "Natural Language to SQL", desc: "Type what you want in plain English. We generate the exact SQL you need instantly." },
                { icon: Globe, title: "Multiple SQL Dialects", desc: "Support for PostgreSQL, MySQL, SQLite, and SQL Server out of the box." },
                { icon: Code2, title: "AI Explanations", desc: "Don't just copy code. Read step-by-step AI breakdowns of how the generated query works." },
                { icon: Database, title: "Database Schema Builder", desc: "Generate full CREATE TABLE statements and visualize your database architecture." },
                { icon: History, title: "Query History", desc: "Every generated query is saved securely. Search, favorite, and reuse past queries." },
                { icon: Lock, title: "Secure Authentication", desc: "Enterprise-grade security with encrypted JWTs and secure OTP email verification." }
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How It Works</h2>
                <div className="space-y-6">
                  {[
                    { step: "1", title: "Describe your query", desc: "Write out what you're trying to achieve in natural, everyday language." },
                    { step: "2", title: "AI generates the SQL", desc: "Our fine-tuned models understand your database context and generate precise SQL." },
                    { step: "3", title: "Save & Execute", desc: "Copy the code directly, save it to your history, or add the tables to your schema viewer." }
                  ].map((s, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                        {s.step}
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-1">{s.title}</h4>
                        <p className="text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent blur-3xl rounded-full" />
                <div className="relative h-96 rounded-2xl border border-border/50 bg-card/80 backdrop-blur shadow-2xl p-8 flex flex-col justify-center items-center text-center">
                  <DatabaseZap className="w-20 h-20 text-primary/40 mb-6 animate-pulse" />
                  <p className="text-xl font-medium text-muted-foreground">Interactive Demo Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/20 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <DatabaseZap className="w-5 h-5" />
            <span className="font-semibold text-foreground">SQL Studio</span>
          </div>
          <p>© 2026 SQL Studio Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
