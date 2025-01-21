import React from "react";
import { Button } from "@/components/ui/button";
export function AgentsView() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Agent Management</h2>
      <div className="space-y-4">
        {["John Doe", "Jane Smith", "Mike Johnson"].map((agent) => (
          <div
            key={agent}
            className="border rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {agent
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="ml-4">
                <h3 className="font-medium">{agent}</h3>
                <p className="text-sm text-gray-500">Support Agent</p>
              </div>
            </div>
            <Button variant="outline">Manage</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
