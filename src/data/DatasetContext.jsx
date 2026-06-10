import { createContext, useContext, useMemo, useState } from 'react';
import { defaultDataset } from './dataset.js';

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [dataset, setDataset] = useState(defaultDataset);

  const value = useMemo(
    () => ({
      dataset,
      setDataset,
      resetDataset: () => setDataset(defaultDataset),
    }),
    [dataset]
  );

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) throw new Error('useDataset must be used inside DatasetProvider');
  return context;
}
