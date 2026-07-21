import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

import { initializeAnalytics } from './lib/analytics';

import { initializeClarity } from "@/lib/clarity";

initializeAnalytics();
initializeClarity();

createRoot(document.getElementById('root')!).render(<App />);