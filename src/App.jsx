import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles/common.css'
import { api, setAuthToken } from './api'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import GiaoDich from './pages/GiaoDich'
import DanhMuc from './pages/DanhMuc'
import NganSach from './pages/NganSach'
import BaoCao from './pages/BaoCao'
import { DangNhap, DangKy } from './pages/Auth'

function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  useEffect(() => {
    setAuthToken(token);
    if (token) {
      api.get('/auth/me').then(r => setUser(r.data)).catch(()=> setUser(null));
    } else {
      setUser(null);
    }
  }, [token]);
  const login = (t) => { localStorage.setItem('token', t); setToken(t); };
  const logout = () => { localStorage.removeItem('token'); setToken(null); };
  return { token, user, login, logout };
}

function Guard({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/dang-nhap" replace />;
  return children;
}

function Layout({ onLogout, user }){
  return (
    <div>
      <NavBar onLogout={onLogout} user={user} />
      <div className="container">
        <Routes>
          <Route path="/" element={<GiaoDich/>} />
          <Route path="/danh-muc" element={<DanhMuc/>} />
          <Route path="/ngan-sach" element={<NganSach/>} />
          <Route path="/bao-cao" element={<BaoCao/>} />
        </Routes>
      </div>
      <ChatWidget />
      <Footer />
    </div>
  )
}

function App() {
  const auth = useAuth();
  return (
    <BrowserRouter>
      {!auth.token ? (
        <>
          <NavBar minimal />
          <div className="container">
            <Routes>
              <Route path="/dang-ky" element={<DangKy/>} />
              <Route path="*" element={<DangNhap onLogin={auth.login} />} />
            </Routes>
          </div>
        </>
      ) : (
        <Guard>
          <Layout onLogout={auth.logout} user={auth.user} />
        </Guard>
      )}
    </BrowserRouter>
  )
}

export default App
