import { Link } from 'react-router-dom'
import { useState } from 'react'
import './NavBar.css'
import logoImage from '../assets/LogoFinMate4Ucm.png'

export default function NavBar({ onLogout, minimal = false, user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleLogout = () => {
    closeMenu()
    onLogout()
  }

  const getAvatarText = () => {
    return (user?.hoTen || 'NN').split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
  }

  return (
    <>
      {/* Overlay for mobile menu */}
      {isMenuOpen && <div className="nav-overlay" onClick={closeMenu} />}
      
      <nav className="nav">
        {/* Logo section */}
        <div className="nav-brand">
          <img src={logoImage} alt="FinMate4U" className="nav-logo-image" />
        </div>

        {!minimal && (
          <>
            {/* Desktop navigation */}
            <div className="nav-links">
              <Link to="/" className="nav-link" onClick={closeMenu}>
                <span className="material-symbols-rounded">payments</span>
                Giao dịch
              </Link>
              <Link to="/danh-muc" className="nav-link" onClick={closeMenu}>
                <span className="material-symbols-rounded">category</span>
                Danh mục
              </Link>
              <Link to="/ngan-sach" className="nav-link" onClick={closeMenu}>
                <span className="material-symbols-rounded">account_balance_wallet</span>
                Ngân sách
              </Link>
              <Link to="/bao-cao" className="nav-link" onClick={closeMenu}>
                <span className="material-symbols-rounded">analytics</span>
                Báo cáo
              </Link>
            </div>

            {/* User section */}
            <div className="nav-user">
              {user && (
                <div className="user-info">
                  <div className="user-avatar">
                    {getAvatarText()}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.hoTen || 'Người dùng'}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
              )}
              <button 
                className="logout-btn" 
                onClick={handleLogout}
                aria-label="Đăng xuất"
              >
                <span className="material-symbols-rounded">logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              className="hamburger-btn"
              onClick={toggleMenu}
              aria-label="Menu"
              aria-expanded={isMenuOpen}
            >
              <span className="material-symbols-rounded">
                {isMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

            {/* Mobile menu */}
            <div className={`mobile-menu ${isMenuOpen ? 'mobile-menu--open' : ''}`}>
              <div className="mobile-user-info">
                <div className="user-avatar mobile-avatar">
                  {getAvatarText()}
                </div>
                <div className="user-details">
                  <div className="user-name">{user?.hoTen || 'Người dùng'}</div>
                  <div className="user-email">{user?.email}</div>
                </div>
              </div>
              
              <div className="mobile-nav-links">
                <Link to="/" className="mobile-nav-link" onClick={closeMenu}>
                  <span className="material-symbols-rounded">payments</span>
                  Giao dịch
                </Link>
                <Link to="/danh-muc" className="mobile-nav-link" onClick={closeMenu}>
                  <span className="material-symbols-rounded">category</span>
                  Danh mục
                </Link>
                <Link to="/ngan-sach" className="mobile-nav-link" onClick={closeMenu}>
                  <span className="material-symbols-rounded">account_balance_wallet</span>
                  Ngân sách
                </Link>
                <Link to="/bao-cao" className="mobile-nav-link" onClick={closeMenu}>
                  <span className="material-symbols-rounded">analytics</span>
                  Báo cáo
                </Link>
              </div>

              <button 
                className="mobile-logout-btn" 
                onClick={handleLogout}
              >
                <span className="material-symbols-rounded">logout</span>
                Đăng xuất
              </button>
            </div>
          </>
        )}
      </nav>
    </>
  )
}