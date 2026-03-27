import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { fetchCreditScore, fetchCashFlowForecast, askFinancialAdvisor } from '../lib/api';
import { Send, User, Bot, Sparkles } from 'lucide-react';

const Advisor = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm LendraAI, your financial advisor. I've reviewed your latest credit score and cash flow forecast. What can I help you with today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [systemContext, setSystemContext] = useState('');
  
  const bottomRef = useRef(null);

  // Suggested questions
  const suggestions = [
    "Why is my credit score low?",
    "How can I improve my score by 100 points?",
    "Will I have enough cash flow next quarter?",
    "What is my biggest financial risk right now?",
    "How much should I save for tax?"
  ];

  // Load context automatically on mount
  useEffect(() => {
    const loadContext = async () => {
      try {
        const [creditData, cashFlowData] = await Promise.all([
          fetchCreditScore(),
          // Passing default sample values just to get the forecast payload
          fetchCashFlowForecast("NG-SME-001", {
            monthly_revenue: [500000, 480000, 520000, 490000, 510000, 530000],
            ussd_count: [250, 240, 260, 245, 255, 270],
            mobile_money: [150, 145, 155, 148, 152, 160],
            refund_rate: [2.1, 2.3, 1.9, 2.5, 2.0, 1.8],
            settlement_days: [1.5, 1.6, 1.4, 1.7, 1.5, 1.3]
          })
        ]);

        const prompt = `You are LendraAI's financial advisor for African SMEs.
        You have access to this SME's financial data:
        - Credit Score: ${creditData.score} out of 850
        - Risk Level: ${creditData.risk_level}
        - Top factors affecting score: ${creditData.top_factors.join(", ")}
        - Improvement tips: ${creditData.improvement_tips.join(", ")}
        - Cash flow risk: ${cashFlowData.risk_flag ? "Yes - dip predicted" : "No - stable"}
        - Average monthly revenue: ₦${cashFlowData.avg_monthly_revenue}
        - Tax estimate: ₦${cashFlowData.tax_estimate} per quarter

        Give practical, specific advice tailored to Nigerian SMEs.
        Be conversational, encouraging and clear.
        Always respond in plain English — no jargon.
        Keep responses under 150 words unless asked for detail.
        Reference the SME's actual data in your answers.`;

        setSystemContext(prompt);
        setContextLoaded(true);
      } catch (err) {
        console.error("Context load failed", err);
      }
    };
    
    loadContext();
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text) => {
    if (!text.trim() || !contextLoaded || loading) return;

    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const aiResponse = await askFinancialAdvisor(systemContext, text);
      setMessages([...newMsgs, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      setMessages([...newMsgs, { role: 'assistant', content: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (text) => {
    handleSend(text);
  };

  return (
    <div className="h-full flex flex-col space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Ask LendraAI</h1>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">AI Financial Advisor</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border bg-card shadow-lg">
         {/* Chat Area */}
         <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-border">
            {!contextLoaded && (
              <div className="flex items-center justify-center p-3 bg-muted/30 rounded-xl text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-4 border border-border/50">
                 <Sparkles className="w-3 h-3 mr-2 animate-pulse text-primary" />
                 Analyzing transaction data...
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                     
                     <div className="flex-shrink-0 mt-1">
                        {msg.role === 'user' ? (
                          <div className="w-7 h-7 rounded-lg bg-primary text-background flex items-center justify-center shadow-sm">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center shadow-sm">
                            <span className="font-bold text-primary text-[10px]">AI</span>
                          </div>
                        )}
                     </div>

                     <div className={`p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                         msg.role === 'user' 
                           ? 'bg-foreground text-background font-medium' 
                           : 'bg-muted/50 border border-border text-foreground'
                     }`}>
                        {msg.content}
                     </div>

                  </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                     <div className="flex-shrink-0 mt-1 w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center shadow-sm">
                        <span className="font-bold text-primary text-[10px]">AI</span>
                     </div>
                     <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center gap-1.5 h-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                     </div>
                  </div>
              </div>
            )}
            
            <div ref={bottomRef} className="h-1" />
         </div>

         {/* Suggestions Area */}
         {messages.length === 1 && contextLoaded && (
            <div className="px-6 pb-4">
               <div className="flex flex-wrap gap-2">
                 {suggestions.map((s, i) => (
                    <button 
                       key={i} 
                       onClick={() => handleSuggestion(s)}
                       className="text-[10px] font-bold uppercase tracking-tight bg-muted hover:bg-border transition-all border border-border text-muted-foreground hover:text-foreground rounded-full px-4 py-2"
                    >
                      {s}
                    </button>
                 ))}
               </div>
            </div>
         )}

         {/* Input Box */}
         <div className="p-4 bg-background border-t border-border">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
              className="flex relative"
            >
               <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={contextLoaded ? "Ask LendraAI..." : "Loading context..."}
                  disabled={!contextLoaded || loading}
                  className="w-full bg-muted border border-border text-foreground rounded-xl pl-5 pr-14 py-3.5 focus:outline-none focus:border-primary disabled:opacity-50 text-sm transition-all"
               />
               <button 
                  type="submit"
                  disabled={!input.trim() || !contextLoaded || loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-foreground text-background rounded-lg disabled:opacity-50 hover:opacity-90 transition-all shadow-sm"
               >
                  <Send className="w-4 h-4" />
               </button>
            </form>
         </div>
         
      </Card>
    </div>
  );
};

export default Advisor;
