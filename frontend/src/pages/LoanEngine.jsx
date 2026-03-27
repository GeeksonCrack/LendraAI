import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { fetchCreditScore, fetchLoanPreapproval } from '../lib/api.js';
import { CheckCircle, XCircle, Download, PiggyBank, Calendar, Percent, TrendingUp } from 'lucide-react';
import { generateFinancialReport } from '../hooks/useExportPDF.js';

const LoanEngine = () => {
  const [creditData, setCreditData] = useState(null);
  const [loanData, setLoanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Form State
  const [amount, setAmount] = useState(0);
  const [term, setTerm] = useState(6);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [credit, loan] = await Promise.all([
          fetchCreditScore(),
          fetchLoanPreapproval()
        ]);
        setCreditData(credit);
        setLoanData(loan);

        if (loan.approved) {
           setAmount(Math.floor(loan.max_loan_amount / 2));
           setTerm(Math.min(12, loan.tenure_months));
        }
      } catch (err) {
        console.error("Failed to load loan info");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
       <div className="w-8 h-8 rounded-full border-2 border-primary-accent border-t-transparent animate-spin"/>
    </div>
  );

  const { approved, decision, max_loan_amount, interest_rate, tenure_months } = loanData;

  // Safe bounding
  const safeAmount = Math.min(amount, max_loan_amount);
  
  // EMI Computations
  const monthlyRate = (interest_rate / 100) / 12;
  let dynamicEmi = 0;
  if (term > 0 && safeAmount > 0) {
      if (monthlyRate > 0) {
          dynamicEmi = Math.floor(
              (safeAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term))
          );
      } else {
          dynamicEmi = Math.floor(safeAmount / term);
      }
  }

  const handleExport = async () => {
     setIsExporting(true);
     try {
         await generateFinancialReport(creditData, loanData, safeAmount, term, dynamicEmi);
     } catch (e) {
         alert("Export PDF Error: " + e.message);
     }
     setIsExporting(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Loan Pre-Approval</h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Configure your growth financing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 bg-card border-border">
             <div className="space-y-8">
                <div className="flex flex-col items-center justify-center py-6 bg-muted/30 rounded-2xl border border-border/50">
                    <p className="text-muted-foreground uppercase tracking-[0.2em] text-[10px] font-bold mb-2">Maximum Eligibility</p>
                    <div className="text-5xl font-bold text-foreground font-mono tracking-tighter">
                       ₦{max_loan_amount.toLocaleString()}
                    </div>
                </div>

                <div className="space-y-6 px-2">
                   <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-foreground uppercase tracking-tight">Loan Amount</span>
                        <span className="text-lg font-mono font-bold text-primary">₦{safeAmount.toLocaleString()}</span>
                     </div>
                     <input 
                       type="range" 
                       min="50000" 
                       max={max_loan_amount} 
                       step="10000"
                       value={safeAmount}
                       onChange={(e) => setAmount(Number(e.target.value))}
                       className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                     />
                     <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                        <span>₦50,000</span>
                        <span>₦{max_loan_amount.toLocaleString()}</span>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-foreground uppercase tracking-tight">Repayment Tenure</span>
                        <span className="text-lg font-mono font-bold text-primary">{term} Months</span>
                     </div>
                     <input 
                       type="range" 
                       min="3" 
                       max="24" 
                       step="1"
                       value={term}
                       onChange={(e) => setTerm(Number(e.target.value))}
                       className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                     />
                     <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                        <span>3 Months</span>
                        <span>24 Months</span>
                     </div>
                   </div>
                </div>
             </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
             <Card className="p-4 bg-muted/20 border-border/60">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Interest Rate</p>
                <p className="text-xl font-bold text-foreground font-mono">{interest_rate}% p.a.</p>
             </Card>
             <Card className="p-4 bg-muted/20 border-border/60">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Tenure</p>
                <p className="text-xl font-bold text-foreground font-mono">{term} Months</p>
             </Card>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 bg-foreground text-background border-none shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-background/5 rounded-full blur-3xl -mr-16 -mt-16" />
             <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">Monthly Repayment</p>
             <p className="text-4xl font-bold font-mono tracking-tighter mb-8">₦{dynamicEmi.toLocaleString()}</p>
             
             <button className="w-full py-4 bg-background text-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">
                Apply for Loan
             </button>
             <p className="text-[10px] text-center mt-4 opacity-50 font-medium">Terms and conditions apply. Subject to final verification.</p>
          </Card>

          <Card className="p-5 bg-card border-border">
             <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
               <TrendingUp className="w-3 h-3 text-primary" />
               Eligibility Requirements
             </h3>
             <ul className="space-y-3">
               {[
                 "Maintain a LendraAI Score above 550",
                 "Minimum 6 months of Interswitch data",
                 "Consistent monthly USSD transaction volume",
                 "No pending tax liabilities in recent forecast"
               ].map((req, i) => (
                 <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground font-medium">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                    {req}
                 </li>
               ))}
             </ul>
          </Card>
        </div>
      </div>

      {!approved && (
          <Card className="p-8 border-border bg-secondary flex flex-col items-center justify-center text-center space-y-4">
             <h2 className="text-xl font-bold text-text-primary">Score Too Low</h2>
             <p className="text-text-secondary max-w-md">
               Based on your current LendraAI Score ({creditData?.score}), primary financing is unavailable.
             </p>
          </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
         {/* SHAP Insights */}
         <Card className="p-6 border-border bg-secondary flex flex-col">
            <h3 className="font-semibold flex items-center text-text-primary mb-4">
               <TrendingUp className="w-5 h-5 mr-2 text-primary-accent" />
               What influenced your decision
            </h3>
            <ul className="space-y-3 flex-1">
               {creditData?.top_factors?.map((factor, i) => (
                 <li key={i} className="flex items-start text-sm text-text-secondary">
                    <span className="text-primary-accent mr-2 mt-0.5">•</span>
                    <span className="capitalize">{factor.replace(/_/g, ' ')} metrics tracking positively against sector benchmarks.</span>
                 </li>
               ))}
               {!approved && creditData?.improvement_tips?.map((tip, i) => (
                 <li key={i+10} className="flex items-start text-sm text-red-400">
                    <span className="mr-2 mt-0.5">-</span>
                    {tip}
                 </li>
               ))}
            </ul>
         </Card>

         {/* Export Action */}
         <Card className="p-6 border-border bg-secondary flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="font-semibold text-text-primary">Official Financial Report</h3>
            <p className="text-sm text-text-secondary max-w-xs">
               Generate a certified PDF containing your credit profile, cash flow forecast, and eligibility for your investors.
            </p>
            <button 
               onClick={handleExport}
               disabled={isExporting}
               className="mt-2 w-full md:w-auto px-6 py-3 bg-primary-accent hover:bg-primary-accent/90 text-white font-semibold rounded-lg shadow-lg shadow-primary-accent/20 transition-all flex items-center justify-center disabled:opacity-50"
            >
               {isExporting ? (
                 <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
               ) : (
                 <Download className="w-5 h-5 mr-2" />
               )}
               {isExporting ? 'Generating PDF...' : 'Download Full Report'}
            </button>
         </Card>
      </div>

    </div>
  );
};

export default LoanEngine;
