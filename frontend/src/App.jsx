import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { RoomProvider } from './context/RoomContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Members from './pages/Members'
import Analytics from './pages/Analytics'

function App() {
  return (
    <RoomProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/members" element={<Members />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Layout>
      </Router>
    </RoomProvider>
  )
}

export default App

