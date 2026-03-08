import React from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { Sun, Moon, UserRound, Mail, Copy, Sparkles } from "lucide-react";

const Settings = ({ avatarInitial, user, isDarkMode, onOpenTheme, onClose }) => {
  const displayName = user?.displayName ?? "Radeles User";
  const email = user?.email ?? "user@example.com";
  const initial = avatarInitial || "U";
  const [copiedEmail, setCopiedEmail] = React.useState(false);

  const handleCopyEmail = React.useCallback(async () => {
    if (!email) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = email;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedEmail(true);
    } catch {
      // ignore copy failures
    }
  }, [email]);

  React.useEffect(() => {
    if (!copiedEmail) return;
    const timer = setTimeout(() => setCopiedEmail(false), 1600);
    return () => clearTimeout(timer);
  }, [copiedEmail]);

  const overviewStats = [
    { label: "Active chats", value: "12" },
    { label: "Prompts saved", value: "38" },
    { label: "API credits", value: "2.4k" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ duration: 0.25 }}
      style={{
        width: "360px",
        maxWidth: "calc(100% - 2.5rem)",
        padding: "1.6rem",
        borderRadius: "1.35rem",
        background: "#ffffff",
        boxShadow: "0 30px 80px rgba(15, 23, 42, 0.25)",
        border: "1px solid rgba(148, 163, 184, 0.35)",
        display: "flex",
        flexDirection: "column",
        gap: "1.2rem",
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close settings"
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          width: "36px",
          height: "36px",
          borderRadius: "999px",
          border: "1px solid rgba(148,163,184,0.4)",
          background: "rgba(248,250,252,0.9)",
          color: "#0f172a",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        ×
      </button>

      <div
        style={{
          borderRadius: "1.2rem",
          padding: "1.1rem",
          background: "linear-gradient(135deg,#312e81 0%,#4338ca 55%,#6366f1 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              fontWeight: 700,
            }}
          >
            {initial}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontWeight: 700, fontSize: "1.15rem" }}>{displayName}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.9rem", opacity: 0.9 }}>
              <Mail size={16} />
              <span>{email}</span>
            </div>
            <span
              style={{
                alignSelf: "flex-start",
                padding: "0.15rem 0.6rem",
                borderRadius: "999px",
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                background: "rgba(15,23,42,0.35)",
                textTransform: "uppercase",
              }}
            >
              Available for chat
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            fontSize: "0.78rem",
            opacity: 0.85,
            alignItems: "center",
          }}
        >
          <UserRound size={16} />
          <span>Joined · May 2024</span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "0.75rem",
        }}
      >
        {overviewStats.map((stat) => (
          <div
            key={stat.label}
            style={{
              borderRadius: "0.9rem",
              border: "1px solid rgba(148,163,184,0.35)",
              padding: "0.8rem",
              background: "linear-gradient(135deg, rgba(248,250,252,0.95), rgba(241,245,249,0.9))",
              display: "flex",
              flexDirection: "column",
              gap: "0.2rem",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{stat.label}</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "0.75rem",
        }}
      >
        <button
          type="button"
          onClick={handleCopyEmail}
          style={{
            borderRadius: "0.95rem",
            border: "1px solid rgba(148,163,184,0.35)",
            padding: "0.85rem",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.45rem",
            fontWeight: 600,
            color: copiedEmail ? "#0f766e" : "#0f172a",
            boxShadow: "0 12px 28px rgba(148,163,184,0.18)",
            cursor: "pointer",
          }}
        >
          <Copy size={16} />
          {copiedEmail ? "Email copied" : "Copy email"}
        </button>
        <button
          type="button"
          onClick={onOpenTheme}
          style={{
            borderRadius: "0.95rem",
            border: "none",
            padding: "0.85rem",
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.45rem",
            fontWeight: 600,
            color: "white",
            boxShadow: "0 16px 32px rgba(244,63,94,0.35)",
            cursor: "pointer",
          }}
        >
          <Sparkles size={16} />
          Personalize
        </button>
      </div>

      <div
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(148,163,184,0.3)",
          padding: "1rem",
          background: "linear-gradient(135deg, rgba(248,250,252,0.9), rgba(241,245,249,0.9))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          <span style={{ fontWeight: 600, color: "#0f172a" }}>Theme</span>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Customize how Radeles looks</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#0f172a",
            fontWeight: 600,
          }}
        >
          <span>Theme Studio</span>
          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>
            {isDarkMode ? "Dark currently active" : "Light currently active"}
          </span>
        </div>
      </div>

      <div
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(148,163,184,0.3)",
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: isDarkMode
            ? "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(49,46,129,0.85))"
            : "linear-gradient(135deg, rgba(224,242,254,0.9), rgba(219,234,254,0.95))",
          color: isDarkMode ? "#e0f2fe" : "#1e293b",
        }}
      >
        {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
        <span style={{ fontWeight: 600 }}>{isDarkMode ? "Dark mode enabled" : "Light mode enabled"}</span>
      </div>
    </motion.div>
  );
};

Settings.propTypes = {
  avatarInitial: PropTypes.string,
  user: PropTypes.shape({
    displayName: PropTypes.string,
    email: PropTypes.string,
  }),
  isDarkMode: PropTypes.bool.isRequired,
  onOpenTheme: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

Settings.defaultProps = {
  avatarInitial: "",
  user: null,
};

export default Settings;
