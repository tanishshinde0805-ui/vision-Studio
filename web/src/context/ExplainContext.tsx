import React, { createContext, useContext, useState, useEffect } from 'react';

interface ExplainContextType {
  explainMode: boolean;
  toggleExplainMode: () => void;
  setExplainMode: (enabled: boolean) => void;
}

const ExplainContext = createContext<ExplainContextType>({
  explainMode: false,
  toggleExplainMode: () => {},
  setExplainMode: () => {},
});

export const ExplainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [explainMode, setExplainModeState] = useState<boolean>(() => {
    return localStorage.getItem('vs_explain_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('vs_explain_mode', String(explainMode));
  }, [explainMode]);

  const toggleExplainMode = () => setExplainModeState(prev => !prev);
  const setExplainMode = (enabled: boolean) => setExplainModeState(enabled);

  return (
    <ExplainContext.Provider value={{ explainMode, toggleExplainMode, setExplainMode }}>
      {children}
    </ExplainContext.Provider>
  );
};

export const useExplain = () => useContext(ExplainContext);
