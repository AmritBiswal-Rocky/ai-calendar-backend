import React, { createContext, useContext, useState } from "react";

const SkinContext = createContext();

export function SkinProvider({ children }) {
  const [skin, setSkin] = useState("default");

  return (
    <SkinContext.Provider value={{ skin, setSkin }}>
      <div className={`app-skin-${skin}`}>
        {children}
      </div>
    </SkinContext.Provider>
  );
}

export function useSkin() {
  return useContext(SkinContext);
}
