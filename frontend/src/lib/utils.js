export const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  export const getScoreColor = (score) => {
    if (score >= 700) return '#10b981'; // Success Green (concentrated)
    if (score >= 580) return '#f59e0b'; // Warning Amber
    return '#ef4444'; // Danger Red
  };
  
  export const getBadgeVariantForRisk = (riskLevel) => {
    const map = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
    };
    return map[riskLevel?.toLowerCase()] || 'default';
  };
  
  export const getConfidenceBadge = (confidence) => {
    const map = {
      high: 'success',
      medium: 'warning',
      low: 'danger',
    };
    return map[confidence?.toLowerCase()] || 'default';
  };
