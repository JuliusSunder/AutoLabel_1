/**
 * Renderer process entry point
 */

import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './renderer/App';
import { AuthGuard } from './renderer/components/AuthGuard';

// Mount React app
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  React.createElement(AuthGuard, null, React.createElement(App))
);
