import { Outlet } from '@tanstack/react-router';

import { CommandPalette } from '../ui/command-palette';

import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

export const ShellLayout = () => {
  return (
    <div className="grid min-h-screen grid-cols-[280px_1fr] bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="relative flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
        <CommandPalette />
      </div>
    </div>
  );
};
