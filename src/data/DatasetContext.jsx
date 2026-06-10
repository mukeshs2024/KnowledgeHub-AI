import { createContext, useContext, useMemo, useState, useEffect } from 'react';

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [activeDataset, setActiveDataset] = useState(() => {
    // Initialize from localStorage if available
    try {
      const stored = sessionStorage.getItem('activeDataset');
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.error('Failed to load dataset from storage:', err);
      return null;
    }
  });

  // Persist dataset to sessionStorage whenever it changes
  useEffect(() => {
    if (activeDataset) {
      try {
        sessionStorage.setItem('activeDataset', JSON.stringify(activeDataset));
      } catch (err) {
        console.error('Failed to save dataset to storage:', err);
      }
    } else {
      sessionStorage.removeItem('activeDataset');
    }
  }, [activeDataset]);

  const value = useMemo(
    () => ({
      activeDataset,
      setActiveDataset,
      resetDataset: () => setActiveDataset(null),
      hasDataset: Boolean(activeDataset),
    }),
    [activeDataset]
  );

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) throw new Error('useDataset must be used inside DatasetProvider');
  return context;
}
