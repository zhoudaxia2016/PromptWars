import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, BrowserRouter } from 'react-router-dom';
import App from './App';
import { initLLMConfig } from '@promptwars/llm';
import './index.css';

const Router = import.meta.env.BASE_URL === '/PromptWars/' ? HashRouter : BrowserRouter;

initLLMConfig();
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Router>
        <App />
      </Router>
    </React.StrictMode>
  );
