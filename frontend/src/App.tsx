
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import halaman dari folder pages
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';
// import ResultPage from './pages/ResultPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute ke Landing Page (Halaman Utama) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Rute ke Halaman Utama Aplikasi (Tempat upload dan edit) */}
        <Route path="/app" element={<AppPage />} />
        
        {/* Rute ke Halaman Hasil */}
        {/* <Route path="/result" element={<ResultPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;