
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../layouts/Layout.js';
import { Home } from '../pages/Home.js';
import { Analytics } from '../pages/Analytics.js';
import { NotFound } from '../pages/NotFound.js';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/analytics/:shortCode" element={<Analytics />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
