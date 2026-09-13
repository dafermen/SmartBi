import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/global.css';

/**
 * Este es el punto de entrada de SmartBI.
 *
 * Una analogía: si la aplicación fuera una obra de teatro, `index.html` sería
 * el teatro vacío y este archivo sería quien coloca la obra (`App`) sobre el
 * escenario (`#root`). A partir de aquí React se encarga de dibujar y
 * actualizar la interfaz cuando cambian los datos.
 *
 * `StrictMode` es una ayuda de desarrollo: hace comprobaciones adicionales
 * para descubrir prácticas inseguras. No agrega nada visible a la pantalla.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
