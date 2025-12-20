import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { RoomProvider } from "./context/RoomContext"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Layout from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import Expenses from "./pages/Expenses"
import Members from "./pages/Members"
import Analytics from "./pages/Analytics"

function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/expenses" element={<Expenses />} />
                      <Route path="/members" element={<Members />} />
                      <Route path="/analytics" element={<Analytics />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </RoomProvider>
    </AuthProvider>
  )
}

export default App
