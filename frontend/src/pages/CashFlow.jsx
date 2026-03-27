import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { fetchCashFlowForecast } from '../lib/api';
import { formatNaira } from '../lib/utils';
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const defaultInput = {
  monthly_revenue: [500000, 480000, 520000, 490000, 510000, 530000],
  ussd_count: [250, 240, 260, 245, 255, 270],
  mobile_money: [150, 145, 155, 148, 152, 160],
  refund_rate: [2.1, 2.3, 1.9, 2.5, 2.0, 1.8],
  settlement_days: [1.5, 1.6, 1.4, 1.7, 1.5, 1.3]
};

const CashFlow = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState(defaultInput);

  const runForecast = async () => {
    setLoading(true);
    const result = await fetchCashFlowForecast("NG-SME-001", inputs);
    
    // Transform forecast array to Recharts friendly format
    const chartData = result.forecast_6months.map((val, index) => ({
      name: `Month ${index + 1}`,
      revenue: val,
      isRiskMonth: result.risk_flag && result.risk_month === `month_${index + 1}`
    }));

    setData({ ...result, chartData });
    setLoading(false);
  };

  useEffect(() => {
    runForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleRevenueChange = (index, value) => {
    const newRev = [...inputs.monthly_revenue];
    newRev[index] = Number(value);
    setInputs({ ...inputs, monthly_revenue: newRev });
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <LoadingSpinner size="lg" className="mb-4" />
        <p>Crunching alternative data sources...</p>
      </div>
    );
  }

  const { risk_flag, risk_month, tax_estimate, avg_monthly_revenue, chartData } = data;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
          <p className="text-muted-foreground text-[10px] font-bold uppercase mb-1">{label}</p>
          <p className="text-sm font-bold text-foreground">{formatNaira(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Cash Flow Intelligence</h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Predictive Revenue Forecasting</p>
        </div>
      </div>

      {/* Risk Alert Banner */}
      {risk_flag && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3">
           <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
           <div>
              <h3 className="text-red-500 font-bold text-sm uppercase tracking-tight">Liquidity Warning</h3>
              <p className="text-red-500/70 text-[11px] font-medium leading-relaxed mt-1">
                A revenue dip is predicted for <strong>{risk_month.replace('_', ' ')}</strong>. Recommended reserve: {formatNaira(tax_estimate * 2)}.
              </p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Chart Column */}
        <div className="lg:col-span-8 space-y-4">
           <Card className="h-80 flex flex-col p-6 bg-card border-border relative group overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
               <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="text-[10px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                     <TrendingUp className="w-3 h-3 text-primary" />
                     6-Month Revenue Projection
                  </h3>
               </div>
               <div className="flex-1 w-full min-h-0 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                      <XAxis 
                        dataKey="name" 
                        stroke="var(--color-muted-foreground)" 
                        tick={{fontSize: 10, fontWeight: 600}} 
                        axisLine={false} 
                        tickLine={false} 
                        dy={10}
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--color-muted)', opacity: 0.2}} />
                      <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.isRiskMonth ? '#ef4444' : 'var(--color-primary)'} 
                            fillOpacity={entry.isRiskMonth ? 0.8 : 0.6}
                            className="transition-all duration-500 hover:fill-opacity-100"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
           </Card>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4 bg-card border-border">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Avg. Monthly Projection</p>
                 <p className="text-2xl font-bold text-foreground tracking-tight">{formatNaira(avg_monthly_revenue)}</p>
              </Card>
              <Card className="p-4 bg-card border-border">
                 <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tax Liability Est.</p>
                      <p className="text-2xl font-bold text-foreground tracking-tight">{formatNaira(tax_estimate)}</p>
                    </div>
                    <div className="p-2 bg-muted rounded-lg border border-border text-muted-foreground">
                        <TrendingDown className="w-4 h-4" />
                    </div>
                 </div>
              </Card>
           </div>
        </div>

        {/* Form Column */}
        <Card className="lg:col-span-4 h-fit bg-card border-border">
           <CardHeader title="Historical Data" subtitle="Update revenue to refine forecast" className="px-4 py-3" />
           <CardContent className="space-y-3 px-4 pb-4">
               <div className="grid grid-cols-2 gap-2">
                  {inputs.monthly_revenue.map((val, i) => (
                     <div key={i}>
                        <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Month {i + 1}</label>
                        <input 
                           type="number" 
                           value={val}
                           onChange={(e) => handleRevenueChange(i, e.target.value)}
                           className="w-full bg-muted border border-border text-foreground rounded-md px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary transition-colors"
                        />
                     </div>
                  ))}
               </div>

               <div className="bg-muted/50 text-[10px] text-muted-foreground p-3 rounded-lg border border-border italic leading-relaxed">
                  "USSD peaks typically occur between months 3-5. Ensure buffers are optimized."
               </div>

               <button 
                  onClick={runForecast}
                  disabled={loading}
                  className="w-full bg-foreground text-background font-bold py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex justify-center items-center text-xs uppercase tracking-widest shadow-sm"
               >
                  {loading ? <LoadingSpinner size="sm" /> : 'Recalculate'}
               </button>
           </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default CashFlow;
