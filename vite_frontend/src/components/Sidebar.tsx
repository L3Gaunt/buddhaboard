import React from "react";
import { Inbox, BarChart3, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
const views = {
  TICKETS: "tickets",
  DASHBOARD: "dashboard",
  AGENTS: "agents",
  CHAT: "chat",
};
export function Sidebar({ currentView, setCurrentView, isMobileMenuOpen }) {
  return (
    <div
      className={`${isMobileMenuOpen ? "block" : "hidden"} md:block fixed md:relative z-40 w-64 h-full bg-white border-r border-gray-200`}
    >
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Support Desk</h1>
      </div>
      <nav className="p-4 space-y-2">
        <Button
          variant={currentView === views.TICKETS ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => setCurrentView(views.TICKETS)}
        >
          <Inbox className="mr-2 h-4 w-4" />
          Tickets
        </Button>
        <Button
          variant={currentView === views.DASHBOARD ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => setCurrentView(views.DASHBOARD)}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant={currentView === views.AGENTS ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => setCurrentView(views.AGENTS)}
        >
          <Users className="mr-2 h-4 w-4" />
          Agents
        </Button>
        <Button
          variant={currentView === views.CHAT ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => setCurrentView(views.CHAT)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Live Chat
        </Button>
      </nav>
    </div>
  );
}
