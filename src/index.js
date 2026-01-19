import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // <--- ESTA LÍNEA ES CRITICA PARA EL DISEÑO
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
