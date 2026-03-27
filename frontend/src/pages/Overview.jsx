import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { fetchCreditScore } from '../lib/api';
import { formatNaira, getScoreColor, getBadgeVariantForRisk, getConfidenceBadge } from '../lib/utils';
import { TrendingUp, TrendingDown, Info, CircleDollarSign, Smartphone, RotateCcw, CalendarClock } from 'lucide-react';

const Overview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await fetchCreditScore();
        setData(result);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const renderGauge = (score) => {
    const percentage = Math.min(Math.max((score - 300) / (850 - 300), 0), 1) * 100;
    const color = getScoreColor(score);
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex flex-col items-center justify-center py-4">
        <svg className="w-48 h-48 transform -rotate-90">
          <circle
            cx="96" cy="96" r={radius}
            stroke="currentColor" strokeWidth="12" fill="transparent"
            className="text-border"
          />
          <circle
            cx="96" cy="96" r={radius}
            stroke={color} strokeWidth="12" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-foreground">{score}</span>
          <span className="text-sm text-muted-foreground mt-1">out of 850</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <LoadingSpinner size="lg" className="mb-4" />
        <p>Analyzing financial profile...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-md p-8 text-center border-danger/30">
          <p className="text-foreground mb-4 text-lg">Unable to load data. Please try again.</p>
          <button 
             onClick={() => window.location.reload()}
             className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 transition"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">SME Overview</h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Financial Profile & Health</p>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono">UPDATED: {new Date().toLocaleTimeString()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Credit Score Gauge Card */}
        <Card className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-card border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-500" />
          <h2 className="text-base font-bold text-foreground mb-2">LendraAI Score</h2>
          {renderGauge(data.score)}
          <Badge variant={getBadgeVariantForRisk(data.risk_level)} className="mt-4 px-4 py-1 text-sm font-bold shadow-sm">
            {data.risk_level?.toUpperCase()} RISK
          </Badge>
          
          <div className="mt-6 w-full space-y-3">
             <div className="flex justify-between items-center text-xs group relative border-b border-border/50 pb-2">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                   Reliability Index
                   <Info className="w-3 h-3" />
                </span>
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-muted border border-border text-[10px] text-foreground p-2 rounded-lg shadow-xl z-10 text-center pointer-events-none">
                   Based on 12+ months of consistent transaction data.
                </div>
                <Badge variant={getConfidenceBadge(data.confidence)} className="font-bold">{data.confidence?.toUpperCase()}</Badge>
             </div>
          </div>
        </Card>

        {/* Key Risk Drivers */}
        <Card className="lg:col-span-8 bg-card border-border">
          <CardHeader 
            title="Risk Analysis" 
            subtitle="Top factors influencing your current credit standing" 
          />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-3">
                  {data.top_factors?.map((factor, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-muted/40 rounded-xl border border-border/40 hover:border-border transition-colors group">
                       <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                          {i === 0 ? <CalendarClock className="w-4 h-4"/> : i === 1 ? <RotateCcw className="w-4 h-4"/> : <Smartphone className="w-4 h-4"/>}
                       </div>
                       <div>
                           <p className="text-sm font-bold text-foreground capitalize leading-none mb-1">{factor.replace(/_/g, ' ')}</p>
                           <p className="text-[10px] text-muted-foreground font-medium">Critical rating factor.</p>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                  <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2 uppercase tracking-widest">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    How to improve
                  </h4>
                  <div className="space-y-2">
                    {data.improvement_tips?.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground font-medium">
                        <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                        {tip}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <h3 className="text-sm font-bold text-foreground uppercase tracking-[0.2em] mt-8 mb-4">Core Metrics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: 'Monthly Revenue', value: formatNaira(577000), icon: <CircleDollarSign className="w-5 h-5"/> },
           { label: 'USSD Transactions', value: '252', sub: '/mo', icon: <Smartphone className="w-5 h-5"/> },
           { label: 'Refund Rate', value: '2.3%', icon: <RotateCcw className="w-5 h-5"/> },
           { label: 'Settlement Days', value: '1.6', sub: 'avg', icon: <CalendarClock className="w-5 h-5"/> }
         ].map((stat, i) => (
           <Card key={i} className="p-4 bg-card border-border hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                 <div className="p-2 bg-muted rounded-lg text-foreground group-hover:bg-primary group-hover:text-background transition-colors">
                    {stat.icon}
                 </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-foreground tracking-tight">
                  {stat.value}
                  {stat.sub && <span className="text-[10px] text-muted-foreground font-normal ml-1">{stat.sub}</span>}
                </p>
              </div>
           </Card>
         ))}
      </div>
    </div>
  );
};

export default Overview;
