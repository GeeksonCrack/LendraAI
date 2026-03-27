import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchCashFlowForecast } from '../lib/api.js';

export const generateFinancialReport = async (creditData, loanData, customAmt = 0, customTerm = 0, customEmi = 0) => {
  try {
    const doc = new jsPDF();
    
    // Default brand colors (Refined for concentrated theme)
    const primaryColor = [10, 10, 10]; // Concentrated Primary (Black)
    const accentColor = [115, 115, 115]; // Neutral Gray
    const textColor = [40, 40, 40];
    const riskColor = [239, 68, 68]; // Red

    // --- Header ---
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("LendraAI", 20, 26);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Generated: ${dateStr}`, 140, 26);

    // --- SME Details ---
    doc.setTextColor(...primaryColor);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Certified Financial Intelligence Report", 20, 55);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);
    doc.text("Business Name: Mama Tunde Store", 20, 65);
    doc.text("Category: Retail", 20, 72);
    if(creditData) {
        doc.text(`Business ID: ${creditData.business_id || "NG-SME-001"}`, 20, 79);
    }

    // --- AI Credit Profile ---
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 85, 190, 85);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text("1. LendraAI Credit Profile", 20, 95);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...textColor);
    if(creditData) {
        doc.setFont("helvetica", "bold");
        doc.text(`Credit Score: ${creditData.score} / 850`, 20, 105);
        
        doc.setFont("helvetica", "normal");
        const riskLevel = (creditData.risk_level || "low").toUpperCase();
        doc.text(`Risk Assessment: `, 20, 112);
        
        if (riskLevel === 'LOW') doc.setTextColor(16, 185, 129);
        else if (riskLevel === 'MEDIUM') doc.setTextColor(245, 158, 11);
        else doc.setTextColor(239, 68, 68);
        
        doc.setFont("helvetica", "bold");
        doc.text(riskLevel, 55, 112);
        
        doc.setTextColor(...textColor);
        doc.setFont("helvetica", "bold");
        doc.text("Top Influencing Factors:", 20, 122);
        doc.setFont("helvetica", "normal");
        if(creditData.top_factors && Array.isArray(creditData.top_factors)) {
            creditData.top_factors.forEach((factor, i) => {
                const cleanName = factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                doc.text(`• ${cleanName} metrics tracking against sector benchmarks`, 25, 130 + (i * 7));
            });
        }
    }

    // --- Loan Eligibility ---
    doc.setTextColor(...primaryColor);
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 155, 190, 155);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("2. SME Growth Financing Eligibility", 20, 165);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    if (loanData && loanData.approved) {
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        
        const printAmt = customAmt > 0 ? customAmt : loanData.max_loan_amount;
        const printTerm = customTerm > 0 ? customTerm : loanData.tenure_months;
        const printEmi = customEmi > 0 ? customEmi : loanData.monthly_payment;
        
        doc.text(`STATUS: PRE-APPROVED`, 20, 175);
        doc.setTextColor(...textColor);
        doc.text(`Max Eligibility: NGN ${loanData.max_loan_amount.toLocaleString()}`, 20, 183);
        
        if (customAmt > 0) {
            doc.setFont("helvetica", "italic");
            doc.text(`Configuration: NGN ${printAmt.toLocaleString()} over ${printTerm} months`, 20, 190);
            doc.text(`Estimated Repayment: NGN ${printEmi.toLocaleString()} / month`, 20, 197);
        }
    } else {
        doc.setTextColor(...riskColor);
        doc.setFont("helvetica", "bold");
        doc.text("STATUS: PRIMARY FINANCING UNAVAILABLE", 20, 175);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...textColor);
        doc.text(`Reason: ${loanData?.decision || 'Credit profile requires further seasoning.'}`, 20, 183);
    }

    // --- 6 Month Cash Flow Forecast ---
    doc.setTextColor(...primaryColor);
    doc.line(20, 210, 190, 210);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("3. AI-Driven Cash Flow Forecast", 20, 220);

    const forecast = await fetchCashFlowForecast("NG-SME-001", {
        monthly_revenue: [500000, 480000, 520000, 490000, 510000, 530000],
        ussd_count: [250, 240, 260, 245, 255, 270],
        mobile_money: [150, 145, 155, 148, 152, 160],
        refund_rate: [2.1, 2.3, 1.9, 2.5, 2.0, 1.8],
        settlement_days: [1.5, 1.6, 1.4, 1.7, 1.5, 1.3]
    });

    if(forecast && forecast.forecast_6months) {
        const tableData = forecast.forecast_6months.map((amt, i) => [
            `Month ${i + 1}`, 
            `NGN ${amt.toLocaleString()}`,
            forecast.risk_flag && forecast.risk_month === `month_${i+1}` ? 'High Risk' : 'Stable'
        ]);

        autoTable(doc, {
            startY: 228,
            head: [['Timeline', 'Predicted Revenue', 'AI Status']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: primaryColor },
            margin: { left: 20, right: 20 },
            styles: { font: "helvetica", fontSize: 10 }
        });
    }

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Powered by Interswitch × LendraAI", 20, pageHeight - 15);
    doc.text("Strictly Confidential", 150, pageHeight - 15);

    // Save
    doc.save("LendraAI_Financial_Report.pdf");

  } catch (error) {
    console.error("Failed to generate PDF", error);
    throw error;
  }
};
