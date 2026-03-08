import React from "react";
import { useSkin } from "../context/SkinContext";

export default function SkinToggle() {
  const { skin, setSkin } = useSkin();

  return (
    <div className="skin-toggle">
      <button
        type="button"
        onClick={() => setSkin("default")}
        className={skin === "default" ? "active" : ""}
      >
        Default
      </button>
      <button
        type="button"
        onClick={() => setSkin("dark")}
        className={skin === "dark" ? "active" : ""}
      >
        Dark
      </button>
      <button
        type="button"
        onClick={() => setSkin("futuristic")}
        className={skin === "futuristic" ? "active" : ""}
      >
        Futuristic
      </button>
    </div>
  );
}
