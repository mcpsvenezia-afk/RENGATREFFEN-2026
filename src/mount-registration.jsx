import React from 'react'
import ReactDOM from 'react-dom/client'
import RegistrationForm from './components/RegistrationForm'
import './style.css'

const rootElement = document.getElementById('root-registration-form');

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <RegistrationForm />
        </React.StrictMode>
    )
}
