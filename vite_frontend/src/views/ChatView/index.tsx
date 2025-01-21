import React from "react";
import { MessageSquare } from "lucide-react";
export function ChatView() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Live Chat</h2>
      <div className="text-center text-gray-500 py-8">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No active chat sessions</p>
      </div>
    </div>
  );
}
