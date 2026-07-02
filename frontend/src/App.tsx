import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Navbar from './components/Navbar';
import CaseFileList from './pages/CaseFileList';
import NewCaseFile from './pages/NewCaseFile';
import FileDetail from './pages/FileDetail';
import './index.css';

function ProtectedLayout() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/auth" replace />;
  return (
    <>
      <Navbar />
      <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<CaseFileList />} />
          <Route path="/new" element={<NewCaseFile />} />
          <Route path="/file/:reference_number" element={<FileDetail />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
