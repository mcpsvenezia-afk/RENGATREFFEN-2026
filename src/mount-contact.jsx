import React from 'react'
import ReactDOM from 'react-dom/client'
import ContactForm from './components/ContactForm'
import './style.css'

const rootElement = document.getElementById('root-contact-form');

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <ContactForm />
        </React.StrictMode>
    )
}
