import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onRegistered(r) {
    // opzionale: log
    // console.log('SW registered', r);
  },
  onRegisterError(error) {
    console.log('SW registration error', error);
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
