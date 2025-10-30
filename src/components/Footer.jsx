import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">
          © {currentYear} finmate4u. Your financial{' '}
          <span className="mate-text">mate</span>
          <span className="sparkling-heart">♥</span>.
        </p>
      </div>
    </footer>
  );
}