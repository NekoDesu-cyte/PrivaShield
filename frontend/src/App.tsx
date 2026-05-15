import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute "/" (Halaman utama) diarahkan ke LandingPage */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Rute "/app" (Halaman Editor) diarahkan ke AppPage */}
        <Route path="/app" element={<AppPage />} />
      </Routes>
    </Router>
  );
}

export default App;