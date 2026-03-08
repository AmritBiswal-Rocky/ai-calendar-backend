import React from 'react';

const DraftAwareEvent = ({ event }) => {
  if (event.isDraft) {
    return (
      <div className="blue-draft-card" style={{
        background: "linear-gradient(135deg, #6366f1, #a855f7)",
        border: "none",
        color: "#ffffff",
        borderRadius: "8px",
        padding: "4px 6px",
        fontWeight: "500",
        opacity: 1,
        fontSize: "12px",
        textAlign: "center",
      }}>
        {event.title}
      </div>
    );
  }

  return (
    <div style={{
      background: "#f0f0f0",
      border: "1px solid #ddd",
      borderRadius: "4px",
      padding: "2px 4px",
      fontSize: "12px",
      color: "#333",
    }}>
      {event.title}
    </div>
  );
};

export default DraftAwareEvent;
