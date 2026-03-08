import React from 'react';

const TimelineModal = ({ isOpen, selectedDate, onClose, onConfirm }) => {
  const times = React.useMemo(() => {
    // Generate hourly slots from 6:00 to 23:00 (adjust as needed)
    const out = [];
    for (let h = 6; h <= 23; h++) out.push({ h, m: 0 });
    return out;
  }, []);

  const formatTimeLabel = (h, m) => {
    const dt = new Date();
    dt.setHours(h, m, 0, 0);
    return dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  const toValueHHMM = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        className="modal-container"
        style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '12px',
          minWidth: '560px',
          maxWidth: '720px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#6b7280' }}
          >
            {'<'} Back
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            Select Time{selectedDate ? ` for ${selectedDate}` : ''}
          </h2>
          <span />
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {times.map((t) => (
            <button
              key={`${t.h}:${t.m}`}
              onClick={() => onConfirm?.(toValueHHMM(t.h, t.m))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '14px 18px',
                background: 'white',
                cursor: 'pointer',
                fontSize: 15,
              }}
            >
              <span>{formatTimeLabel(t.h, t.m)}</span>
              <span
                style={{
                  display: 'inline-block',
                  height: 18,
                  width: 18,
                  borderRadius: 9999,
                  border: '2px solid #3b82f6',
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineModal;
