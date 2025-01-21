import React from "react";
export function DashboardView() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["Open Tickets", "Avg Response Time", "Customer Satisfaction"].map(
          (metric) => (
            <div key={metric} className="border rounded-lg p-4">
              <h3 className="text-sm text-gray-500">{metric}</h3>
              <p className="text-2xl font-semibold mt-1">
                {metric === "Open Tickets"
                  ? "23"
                  : metric === "Avg Response Time"
                    ? "1.5h"
                    : "94%"}
              </p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
