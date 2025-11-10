import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AuthCallback from './AuthCallback';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const path = window.location.pathname;

if (path.startsWith('/auth/callback')) {
    root.render(<AuthCallback />);
} else {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
}
