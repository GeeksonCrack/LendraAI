import React, { useState } from 'react';
import { Store, Download, Loader2 } from 'lucide-react';
import { generateFinancialReport } from '../../hooks/useExportPDF.js';
import { fetchCreditScore, fetchLoanPreapproval } from '../../lib/api.js';

const Topbar = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
        const [creditData, loanData] = await Promise.all([
            fetchCreditScore(),
            fetchLoanPreapproval()
        ]);
        await generateFinancialReport(creditData, loanData);
    } catch (e) {
        console.error("Topbar PDF Export Failed");
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-8 flex-shrink-0 z-10 sticky top-0">
      
      {/* Action Area */}
      <div>
         <button 
           onClick={handleExport}
           disabled={isExporting}
           className="flex items-center space-x-2 bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-full border border-border text-sm font-medium transition-all disabled:opacity-50"
         >
           {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
           <span>{isExporting ? 'Generating PDF...' : 'Export Report'}</span>
         </button>
      </div>

      {/* Profile Badge */}
      <div className="flex items-center space-x-4 bg-muted px-4 py-2 rounded-full border border-border">
        <div className="flex items-center space-x-2">
            <Store className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Mama Tunde Store</span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-background border border-border">
          Retail
        </span>
      </div>
    </header>
  );
};

export default Topbar;
