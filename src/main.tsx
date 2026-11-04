import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { BrandingProvider } from './lib/branding'
import { CartProvider } from './lib/cart'
import { CustomerAuthProvider } from './lib/auth'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <BrandingProvider>
        <CartProvider>
          <CustomerAuthProvider>
            <App />
          </CustomerAuthProvider>
        </CartProvider>
      </BrandingProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
