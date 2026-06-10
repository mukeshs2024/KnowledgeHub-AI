import AppRoutes from './routes/AppRoutes.jsx';
import { DatasetProvider } from './data/DatasetContext.jsx';

export default function App() {
  return (
    <DatasetProvider>
      <AppRoutes />
    </DatasetProvider>
  );
}
