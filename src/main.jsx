import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { Toaster } from 'sonner'

import App from './App.jsx'
import i18n from './i18n'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <App />
        <Toaster 
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
      </I18nextProvider>
    </BrowserRouter>
  </StrictMode>,
)
