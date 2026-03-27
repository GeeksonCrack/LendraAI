import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { fetchCashFlowForecast } from './api.js';

export const generateFinancialReport = async (creditData, loanData) => {
  try {
    const doc = new jsPDF();
    
    // Default brand colors
    const primaryColor = [29, 158, 117]; // #1D9E75 LendraAI green
    const darkColor = [15, 23, 42]; // #0f172a navy base
    const textColor = [50, 50, 50];

    // --- Header ---
    doc.setFillColor(...darkColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    // Draw simple Logo "L" instead of image to keep it clean
    doc.text("LendraAI", 20, 26);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Generated: ${dateStr}`, 140, 26);

    // --- SME Details ---
    doc.setTextColor(...darkColor);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Intelligence Report", 20, 55);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);
    doc.text("Business Name: Mama Tunde Store", 20, 65);
    doc.text("Category: Retail", 20, 72);
    doc.text(`Business ID: ${creditData.business_id}`, 20, 79);

    // --- AI Credit Profile ---
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 85, 190, 85);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...darkColor);
    doc.text("1. LendraAI Credit Profile", 20, 95);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...textColor);
    doc.text(`Credit Score: ${creditData.score} / 850`, 20, 105);
    doc.text(`Risk Assessment: ${creditData.risk_level.toUpperCase()}`, 20, 112);
    
    doc.setFont("helvetica", "bold");
    doc.text("Top Influencing Factors (SHAP):", 20, 122);
    doc.setFont("helvetica", "normal");
    creditData.top_factors.forEach((factor, i) => {
        const cleanName = factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        doc.text(`• ${cleanName}`, 25, 130 + (i * 7));
    });

    // --- Loan Pre-Approval ---
    doc.line(20, 155, 190, 155);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...darkColor);
    doc.text("2. Instant Credit Decision", 20, 165);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    if (loanData.approved) {
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text(`PRE-APPROVED: NGN ${loanData.max_loan_amount.toLocaleString()}`, 20, 175);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...textColor);
        doc.text(`Interest Rate: ${loanData.interest_rate}% p.a.`, 20, 183);
        doc.text(`Repayment Tenure: ${loanData.tenure_months} Months`, 20, 190);
        doc.text(`Estimated EMI: NGN ${loanData.monthly_payment.toLocaleString()} / month`, 20, 197);
    } else {
        doc.setTextColor(220, 38, 38);
        doc.text("STATUS: Not Approved for Primary Financing", 20, 175);
        doc.setTextColor(...textColor);
        doc.text(`Reason: ${loanData.decision}`, 20, 183);
    }

    // --- 6 Month Cash Flow Forecast ---
    doc.line(20, 210, 190, 210);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...darkColor);
    doc.text("3. Cash Flow Forecast (Next 6 Months)", 20, 220);

    // Fetch forecast dynamically for the table
    // Passing default dummy array since we don't have the live inputs connected globally here
    const forecast = await fetchCashFlowForecast("NG-SME-001", {
        monthly_revenue: [500000, 480000, 520000, 490000, 510000, 530000],
        ussd_count: [250, 240, 260, 245, 255, 270],
        mobile_money: [150, 145, 155, 148, 152, 160],
        refund_rate: [2.1, 2.3, 1.9, 2.5, 2.0, 1.8],
        settlement_days: [1.5, 1.6, 1.4, 1.7, 1.5, 1.3]
    });

    const tableData = forecast.forecast_6months.map((amt, i) => [
        `Month ${i + 1}`, 
        `NGN ${amt.toLocaleString()}`,
        forecast.risk_flag && forecast.risk_month === `month_${i+1}` ? 'High Risk' : 'Stable'
    ]);

    doc.autoTable({
        startY: 228,
        head: [['Timeline', 'Predicted Revenue', 'AI Confidence']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        margin: { left: 20, right: 20 },
        styles: { font: "helvetica", fontSize: 10 }
    });

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
  }
};
