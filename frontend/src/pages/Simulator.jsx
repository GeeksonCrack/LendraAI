import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useDebounce } from '../hooks/useDebounce';
import { simulateScore, fetchCreditScore } from '../lib/api';
import { getScoreColor, getBadgeVariantForRisk } from '../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const defaultSliders = {
  months_delayed: 2,
  high_risk: 1,
  max_pay_delay: 2,
  avg_pay_delay: 0.5,
  credit_util: 0.45,
};

const Simulator = () => {
  const [baseData, setBaseData] = useState(null);
  const [changes, setChanges] = useState(defaultSliders);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const debouncedChanges = useDebounce(changes, 300);

  // Load initial base score
  useEffect(() => {
    const init = async () => {
      try {
         const result = await fetchCreditScore();
         setBaseData(result);
      } catch (e) {
         console.error(e);
      }
    };
    init();
  }, []);

  // Run simulation whenever debounced sliders change
  useEffect(() => {
    if (!baseData) return;
    const runSim = async () => {
      setLoading(true);
      const result = await simulateScore("NG-SME-001", debouncedChanges);
      setSimulation(result);
      setLoading(false);
    };
    runSim();
  }, [debouncedChanges, baseData]);

  if (!baseData || (!simulation && loading)) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
         <LoadingSpinner size="lg" className="mb-4" />
         <p>Loading simulator...</p>
       </div>
    );
  }

  const { simulated_score, improvement } = simulation || {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Score Simulator</h1>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Predict the impact of financial decisions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 bg-card border-border">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground uppercase tracking-tight">Payment Delays</span>
                  <span className="text-sm font-mono font-bold text-primary">{changes.months_delayed} mo</span>
                </div>
                <input 
                  type="range" min="0" max="12"
                  value={changes.months_delayed}
                  onChange={(e) => setChanges({...changes, months_delayed: Number(e.target.value)})}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                  <span>No Delays</span>
                  <span>12 Months</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                <div>
                  <p className="text-sm font-bold text-foreground">High Risk Activity</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Flag for irregular transaction patterns</p>
                </div>
                <button 
                  onClick={() => setChanges({...changes, high_risk: changes.high_risk === 1 ? 0 : 1})}
                  className={`w-12 h-6 rounded-full transition-colors relative ${changes.high_risk ? 'bg-primary' : 'bg-muted border border-border'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform bg-background ${changes.high_risk ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground uppercase tracking-tight">Credit Utilisation</span>
                  <span className="text-sm font-mono font-bold text-primary">{Math.round(changes.credit_util * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05"
                  value={changes.credit_util}
                  onChange={(e) => setChanges({...changes, credit_util: Number(e.target.value)})}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col items-center justify-center p-8 bg-muted/20 border-border border-dashed relative">
             <div className="text-center mb-8">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Projected Score</p>
                <div className="text-7xl font-bold text-foreground font-mono tracking-tighter">
                   {simulated_score || '---'}
                </div>
             </div>

             {improvement !== 0 && (
               <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs ${improvement > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {improvement > 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                  {improvement > 0 ? '+' : ''}{improvement} Points
               </div>
             )}

             <div className="mt-8 pt-8 border-t border-border/50 w-full">
                <p className="text-xs text-center text-muted-foreground font-medium italic leading-relaxed">
                   "{simulated_score ? (improvement > 0 ? 'These changes would significantly boost your eligibility.' : 'Warning: This behavior pattern increases lending risk.') : 'Adjust the sliders to see impact.'}"
                </p>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
