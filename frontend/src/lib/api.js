import axios from 'axios';

// Dynamically target the local FastAPI server during development, 
// and the Render deployment in production.
const API_BASE_URL = import.meta.env.DEV ? 'http://127.0.0.1:8000' : 'https://lendraai.onrender.com';

// Fallback Demo Data mappings to represent the API surface required
// This handles the loading and error states for the application gracefully
const DEMO_DATA = {
  business_id: "NG-SME-001",
  score: 567,
  risk_level: "medium",
  confidence: "high",
  top_factors: ["months_delayed", "high_risk", "max_pay_delay"],
  improvement_tips: [
    "Pay all outstanding bills on time for 3+ months",
    "Reduce payment delays — avoid 2+ month delays",
    "Reduce credit utilisation below 70%"
  ],
  monthly_revenue: [500000, 480000, 520000, 490000, 510000, 530000],
  forecast_6months: [520000, 480000, 610000, 590000, 700000, 650000],
  risk_flag: true,
  risk_month: "month_2",
  tax_estimate: 45000,
  avg_monthly_revenue: 521667
};

export const fetchCreditScore = async (businessId = "NG-SME-001") => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/credit-score`, { business_id: businessId });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch real credit score, using fallback data", error);
    // Return the required shape from the fallback
    return {
      score: DEMO_DATA.score,
      risk_level: DEMO_DATA.risk_level,
      confidence: DEMO_DATA.confidence,
      top_factors: DEMO_DATA.top_factors,
      improvement_tips: DEMO_DATA.improvement_tips,
    };
  }
};

export const simulateScore = async (businessId, changes) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/simulate-score`, {
      business_id: businessId,
      changes: changes
    });
    return response.data;
  } catch (error) {
    console.error("Failed to simulate score", error);
    // Simple basic mock logic to return something usable if backend fails
    const mockDiff = Math.floor(Math.random() * 40) - 20; 
    return {
      simulated_score: DEMO_DATA.score + mockDiff,
      improvement: mockDiff,
      message: mockDiff > 0 ? `Making these changes improves your score by ${mockDiff} points` : `These changes would reduce your score — reconsider`
    };
  }
};

export const fetchLoanPreapproval = async (businessId = "NG-SME-001") => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/loan-preapproval`, {
      business_id: businessId
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch loan preapproval, using fallback", error);
    return {
      approved: false,
      decision: "Credit profile requires further seasoning.",
      max_loan_amount: 0,
      interest_rate: 0,
      tenure_months: 0,
      monthly_payment: 0,
      total_repayment: 0,
      message: "Not approved yet. Credit profile requires further seasoning. Use the Score Simulator to improve your score."
    };
  }
};

export const fetchCashFlowForecast = async (businessId, payload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/cash-flow-forecast`, {
      business_id: businessId,
      ...payload
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch cash flow forecast", error);
    return {
      forecast_6months: DEMO_DATA.forecast_6months,
      risk_flag: DEMO_DATA.risk_flag,
      risk_month: DEMO_DATA.risk_month,
      tax_estimate: DEMO_DATA.tax_estimate,
      avg_monthly_revenue: DEMO_DATA.avg_monthly_revenue,
      message: DEMO_DATA.risk_flag ? `Cash flow dip predicted — start saving now` : `Cash flow looks stable for the next 6 months`
    };
  }
};

export const askFinancialAdvisor = async (systemPrompt, userMessage) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/advisor`, {
      system_prompt: systemPrompt,
      user_message: userMessage
    });
    return response.data.reply;
  } catch (error) {
    console.error("Groq API Call Failed", error);
    throw new Error("Unable to connect to AI Advisor. Please try again.");
  }
};
