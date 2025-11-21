
import './App.css'
import SmartCameraControl from './components/SmartCameraControl'
import ErrorBoundary from './components/ErrorBoundary'

function App() {

  return (
    <ErrorBoundary>
      <SmartCameraControl />
    </ErrorBoundary>
  )
}

export default App
