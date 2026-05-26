import 'antd/dist/reset.css'; // or 'antd/dist/antd.css' for older versions
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';

import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#2dd4bf',
          colorInfo: '#38bdf8',
          colorSuccess: '#34d399',
          colorWarning: '#f5b82e',
          colorError: '#fb7185',
          borderRadius: 8,
          colorBgBase: '#05070d',
          colorTextBase: '#e5edf7',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);

reportWebVitals();
