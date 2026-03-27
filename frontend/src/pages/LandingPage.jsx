import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Shield, 
  TrendingUp, 
  ChevronRight, 
  Cpu, 
  LineChart, 
  Layers,
  Code as CodeIcon
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <div className="w-4 h-4 bg-background rounded-sm" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              LendraAI
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#technology" className="hover:text-foreground transition-colors">Technology</a>
            <a href="#team" className="hover:text-foreground transition-colors">Team</a>
            <Link 
              to="/dashboard" 
              className="px-5 py-2.5 bg-foreground text-background rounded-full hover:opacity-90 transition-all font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted text-muted-foreground text-xs font-medium tracking-tight mb-8">
            AI-Powered Fintech
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 text-foreground leading-tight">
            Empowering Smarter Lending <br />
            <span className="text-primary">with Intelligent Data.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Harnessing the power of Machine Learning to provide accurate credit scoring and financial forecasting for the next generation of African SMEs.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/dashboard" 
              className="group w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              View Dashboard
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="https://github.com/GeeksonCrack/LendraAI" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-background border border-border text-foreground rounded-full font-bold transition-all flex items-center justify-center gap-2"
            >
              Explore Docs
            </a>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-32 px-6 border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">The Technology</h2>
              <p className="text-muted-foreground">Cutting-edge machine learning models architected for precision and scalability.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* ML Credit Model */}
            <div className="group p-8 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-all relative overflow-hidden">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 border border-primary/20">
                <Cpu className="text-primary w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">ML Credit Model</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our credit model analyzes thousands of data points including transaction history, merchant profiles, and behavioral patterns to generate real-time risk scores.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  SHAP-based explainability for transparent scoring
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Real-time Interswitch transaction integration
                </li>
              </ul>
            </div>

            {/* ML Forecasting Model */}
            <div className="group p-8 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-all relative overflow-hidden">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 border border-primary/20">
                <LineChart className="text-primary w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">ML Forecasting Model</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Using advanced LSTM (Long Short-Term Memory) neural networks to forecast cash flow and revenue trajectories for small businesses.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Time-series analysis of historical cash flow
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Predictive insights for liquidity management
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Meet the Architects</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">The engineering team behind LendraAI's intelligence and infrastructure.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Agoro Oluwatimilehin",
                alias: "Drizzy",
                role: "ML Engineer",
                desc: "Built the ML Credit Model and the Interactive Dashboard.",
                icon: <Cpu className="w-5 h-5" />
              },
              {
                name: "Ohine Ivori",
                alias: "Lucid",
                role: "Backend Engineer",
                desc: "Architected the robust API infrastructure.",
                icon: <Layers className="w-5 h-5" />
              },
              {
                name: "David Akuabue",
                alias: "Code",
                role: "ML Engineer",
                desc: "Developed the ML Forecasting Model.",
                icon: <CodeIcon className="w-5 h-5" />
              }
            ].map((member, i) => (
              <div key={i} className="group p-8 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-all text-center">
                <div className="w-12 h-12 mx-auto mb-6 rounded-xl flex items-center justify-center bg-muted text-primary border border-border group-hover:scale-110 transition-transform">
                  {member.icon}
                </div>
                <h3 className="text-xl font-bold mb-1 tracking-tight">{member.name}</h3>
                <p className="text-primary text-xs font-bold uppercase tracking-widest mb-4">({member.alias}) • {member.role}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <div className="w-4 h-4 bg-background rounded-sm" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                LendraAI
              </span>
            </Link>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-muted-foreground">
              <span>React</span>
              <span>Tailwind CSS</span>
              <span>Vite</span>
              <span>Lucide Icons</span>
            </div>

            <a 
              href="https://github.com/GeeksonCrack/LendraAI.git"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-full font-bold hover:opacity-90 transition-all group"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              GitHub
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
          
          <div className="mt-20 pt-8 border-t border-border text-center text-muted-foreground text-xs">
            © {new Date().getFullYear()} LendraAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
