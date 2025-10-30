
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate } from 'react-router-dom'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Layout from './components/Layout'
import Home from './pages/Home'
import JobsPage from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Candidates from './pages/Candidates'
import CandidateDetail from './pages/CandidateDetail'
import AssessmentPage from './pages/AssessmentPage'
import AssessmentSubmissions from './pages/AssessmentSubmissions'

// Create router with routes configuration
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="jobs">
        <Route index element={<JobsPage />} />
        <Route path=":jobId">
          <Route index element={<JobDetail />} />
          <Route path="assessment">
            <Route index element={<AssessmentPage />} />
            <Route path="submissions" element={<AssessmentSubmissions />} />
          </Route>
        </Route>
      </Route>
      <Route path="candidates">
        <Route index element={<Candidates />} />
        <Route path=":id" element={<CandidateDetail />} />
      </Route>
      {/* Redirect /assessments to /jobs for backward compatibility */}
      <Route 
        path="assessments" 
        element={<Navigate to="/jobs" replace />} 
      />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
)

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <RouterProvider router={router} />
    </DndProvider>
  )
}

export default App
