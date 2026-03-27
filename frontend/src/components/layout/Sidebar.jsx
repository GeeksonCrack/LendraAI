import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, SlidersHorizontal, TrendingUp, MessageSquareMore, Banknote } from 'lucide-react';
import Logo from '../ui/Logo';

const Sidebar = () => {
  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Score Simulator', path: '/dashboard/simulator', icon: SlidersHorizontal },
    { name: 'Cash Flow', path: '/dashboard/cash-flow', icon: TrendingUp },
    { name: 'AI Advisor', path: '/dashboard/advisor', icon: MessageSquareMore },
    { name: 'Loan Pre-Approval', path: '/dashboard/loan', icon: Banknote },
  ];

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-border w-64 flex-shrink-0 relative z-20">
      
      {/* Brand area */}
      <div className="h-16 flex items-center justify-start border-b border-border bg-sidebar p-6">
        <Logo className="scale-90" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group
              ${isActive 
                ? 'bg-foreground text-background font-bold shadow-md scale-[1.02]' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-background' : 'group-hover:text-foreground'}`} />
                <span className="text-sm tracking-tight">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Badge */}
      <div className="p-4 border-t border-border mt-auto">
        <div className="bg-muted/50 rounded-lg p-3 flex flex-col items-center justify-center border border-border">
           <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground w-full text-center mb-1">Infrastructure by</span>
           <span className="text-xs font-bold text-foreground tracking-tight uppercase">INTERSWITCH</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
