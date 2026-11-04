import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AppErrorBoundary from './components/AppErrorBoundary.tsx'
import './index.css'
import './letter3d.css'
import './letterReading.css'
import './site3d.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AppErrorBoundary>
            <App />
        </AppErrorBoundary>
    </StrictMode>,
)
