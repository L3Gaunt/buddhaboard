import React from "react";
export function TicketQueue({ tickets, setActiveTicket }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Ticket Queue</h2>
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => setActiveTicket(ticket)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{ticket.title}</h3>
                <p className="text-sm text-gray-500">{ticket.description}</p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                {ticket.priority}
              </span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span>Ticket #{ticket.number}</span>
              <span className="mx-2">•</span>
              <span>{ticket.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
