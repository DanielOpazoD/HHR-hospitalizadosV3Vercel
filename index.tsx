import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NotificationProvider } from './context/NotificationContext';
import { ConfirmDialogProvider } from './context/ConfirmDialogContext';
import { DemoModeProvider } from './context/DemoModeContext';
import { firebaseReady, mountConfigWarning } from './firebaseConfig';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const renderApp = () => {
  root.render(
    <React.StrictMode>
      <NotificationProvider>
        <ConfirmDialogProvider>
          <DemoModeProvider>
            <App />
          </DemoModeProvider>
        </ConfirmDialogProvider>
      </NotificationProvider>
    </React.StrictMode>
  );
};

firebaseReady.then(renderApp).catch((error) => {
  console.error('Firebase initialization failed', error);
  mountConfigWarning('No se pudo inicializar Firebase. Revisa las variables de entorno en Netlify.');
});
