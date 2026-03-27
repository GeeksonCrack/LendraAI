import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="hidden md:flex h-full"> 
         <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />
        
        {/* Main scrollable content area */}
        <main id="dashboard-main" className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl h-full">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav could go here */}
        <div className="md:hidden border-t border-border bg-card flex h-16 w-full fixed bottom-0 z-50">
            <div className="flex items-center justify-center w-full text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                Mobile View Optimized
            </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
