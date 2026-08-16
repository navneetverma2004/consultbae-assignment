import { useState } from 'react'
import Header from './components/Header'
import RecordPage from './pages/RecordPage'
import SubmissionsPage from './pages/SubmissionsPage'
import './App.css'

function App() {
  const [page, setPage] = useState('record')
  const [refreshToken, setRefreshToken] = useState(0)

  const handleSubmitted = () => setRefreshToken((n) => n + 1)

  return (
    <>
      <Header page={page} onNavigate={setPage} />
      <main className="app-main">
        {page === 'record' ? (
          <RecordPage onSubmitted={handleSubmitted} />
        ) : (
          <SubmissionsPage refreshToken={refreshToken} />
        )}
      </main>
      <footer className="app-footer">
        <div className="container app-footer__inner">
          <span>ConsultBae Audio Collection</span>
          <span>Built for the ConsultBae technical assignment</span>
        </div>
      </footer>
    </>
  )
}

export default App
