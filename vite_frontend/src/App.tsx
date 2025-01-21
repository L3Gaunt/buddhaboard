import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "./components/Layout";
import { TicketQueue } from "./views/TicketsView/TicketQueue";
import { TicketDetail } from "./views/TicketsView/TicketDetail";
import { DashboardView } from "./views/DashboardView";
import { AgentsView } from "./views/AgentsView";
import { ChatView } from "./views/ChatView";
const views = {
  TICKETS: "tickets",
  DASHBOARD: "dashboard",
  AGENTS: "agents",
  CHAT: "chat",
};
export function App() {
  const [currentView, setCurrentView] = useState(views.TICKETS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [response, setResponse] = useState("");
  const [ticketPriority, setTicketPriority] = useState("Medium");
  const [ticketStatus, setTicketStatus] = useState("Open");
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [assignedAgent, setAssignedAgent] = useState("John Doe");
  const agents = [
    {
      name: "John Doe",
      role: "Senior Support Agent",
      status: "Available",
      avatar: "JD",
    },
    {
      name: "Jane Smith",
      role: "Technical Support",
      status: "Available",
      avatar: "JS",
    },
    {
      name: "Mike Johnson",
      role: "Customer Support",
      status: "Away",
      avatar: "MJ",
    },
    {
      name: "Sarah Wilson",
      role: "Product Specialist",
      status: "Available",
      avatar: "SW",
    },
  ];
  const tickets = [
    {
      id: 1,
      title: "Cannot access account after password reset",
      description: "Customer reported issues logging in...",
      priority: "Medium",
      number: "1234",
      time: "2 hours ago",
      conversation: [
        {
          sender: "Customer",
          message:
            "Hi, I can't log into my account after resetting my password. The new password isn't working.",
          time: "2 hours ago",
        },
        {
          sender: "System",
          message: "Password reset request processed",
          time: "1.5 hours ago",
        },
        {
          sender: "Agent",
          message:
            "Hello! I understand you're having trouble logging in. Could you please confirm if you received the password reset email?",
          time: "1 hour ago",
        },
      ],
    },
    {
      id: 2,
      title: "Feature request: Dark mode",
      description: "User suggesting new feature implementation...",
      priority: "Low",
      number: "1235",
      time: "3 hours ago",
      conversation: [
        {
          sender: "Customer",
          message: "Would love to see a dark mode option in the app!",
          time: "3 hours ago",
        },
      ],
    },
  ];
  return (
    <>
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Agent Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(false)}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Availability Status</h3>
                  <p className="text-sm text-gray-500">
                    Set your current availability
                  </p>
                </div>
                <Button
                  variant={isAvailable ? "default" : "secondary"}
                  onClick={() => setIsAvailable(!isAvailable)}
                >
                  {isAvailable ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {isAvailable ? "Available" : "Away"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-[480px] max-h-[600px] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Reassign Ticket</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowReassignModal(false)}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Current agent:{" "}
                <span className="font-medium text-gray-900">
                  {assignedAgent}
                </span>
              </p>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.name}
                    className={`p-3 rounded-lg border hover:bg-gray-50 cursor-pointer flex items-center justify-between ${assignedAgent === agent.name ? "border-blue-500 bg-blue-50" : ""}`}
                    onClick={() => {
                      setAssignedAgent(agent.name);
                      setShowReassignModal(false);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {agent.avatar}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{agent.name}</h3>
                        <p className="text-sm text-gray-500">{agent.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${agent.status === "Available" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {agent.status}
                      </span>
                      {assignedAgent === agent.name && (
                        <Check className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <Layout
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      >
        {currentView === views.TICKETS && !activeTicket && (
          <TicketQueue tickets={tickets} setActiveTicket={setActiveTicket} />
        )}
        {currentView === views.TICKETS && activeTicket && (
          <TicketDetail
            ticket={activeTicket}
            setActiveTicket={setActiveTicket}
            ticketPriority={ticketPriority}
            setTicketPriority={setTicketPriority}
            ticketStatus={ticketStatus}
            setTicketStatus={setTicketStatus}
            setShowReassignModal={setShowReassignModal}
            response={response}
            setResponse={setResponse}
          />
        )}
        {currentView === views.DASHBOARD && <DashboardView />}
        {currentView === views.AGENTS && <AgentsView />}
        {currentView === views.CHAT && <ChatView />}
      </Layout>
    </>
  );
}
