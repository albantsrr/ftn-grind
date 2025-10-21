import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoutinesList from './pages/RoutinesList';
import CreateRoutine from './pages/CreateRoutine';
import PlayRoutine from './pages/PlayRoutine';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoutinesList />} />
        <Route path="/create" element={<CreateRoutine />} />
        <Route path="/play/:id" element={<PlayRoutine />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
