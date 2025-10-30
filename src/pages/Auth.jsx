import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import './Auth.css'

// --- Hàm kiểm tra lỗi có thể tái sử dụng ---
const validateField = (name, value) => {
  switch (name) {
    case 'email':
      if (!value) return 'Vui lòng nhập email';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email không hợp lệ';
      return '';
    case 'matKhau':
      if (!value) return 'Vui lòng nhập mật khẩu';
      if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
      return '';
    case 'hoTen':
      if (!value.trim()) return 'Vui lòng nhập họ tên';
      return '';
    default:
      return '';
  }
};

export function DangNhap({ onLogin }) {
  const [values, setValues] = useState({ email: '', matKhau: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const nav = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  async function submit(e) {
    e.preventDefault();
    setServerError('');

    // Kiểm tra tất cả các trường trước khi submit
    const newErrors = {
      email: validateField('email', values.email),
      matKhau: validateField('matKhau', values.matKhau),
    };
    setErrors(newErrors);

    // Nếu có lỗi, không cho submit
    if (Object.values(newErrors).some(error => error !== '')) return;

    try {
      const { data } = await api.post('/auth/dang-nhap', values);
      onLogin(data.token);
      nav('/');
    } catch (ex) {
      setServerError(ex.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Đăng nhập</h2>
        <p className="auth-subtitle">Chào mừng trở lại!</p>
        <form onSubmit={submit} noValidate>
          <div className={`md-input ${errors.email ? 'has-error' : ''}`}>
            <input id="email" name="email" value={values.email} onChange={handleChange} onBlur={handleBlur} required />
            <label htmlFor="email">Email</label>
          </div>
          {errors.email && <div className="inline-error">{errors.email}</div>}

          <div className={`md-input ${errors.matKhau ? 'has-error' : ''}`}>
            <input id="password" type="password" name="matKhau" value={values.matKhau} onChange={handleChange} onBlur={handleBlur} required />
            <label htmlFor="password">Mật khẩu</label>
          </div>
          {errors.matKhau && <div className="inline-error">{errors.matKhau}</div>}

          {serverError && <div className="error-message">{serverError}</div>}
          <button className="md-btn primary" type="submit">
            <span className="material-symbols-rounded">login</span> Đăng nhập
          </button>
        </form>
        <p className="auth-switch">Chưa có tài khoản? <Link to="/dang-ky">Đăng ký ngay</Link></p>
      </div>
    </div>
  )
}

export function DangKy() {
  const [values, setValues] = useState({ email: '', hoTen: '', matKhau: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const nav = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };
  
  async function submit(e) {
    e.preventDefault();
    setServerError('');
    setSuccessMsg('');

    const newErrors = {
      email: validateField('email', values.email),
      hoTen: validateField('hoTen', values.hoTen),
      matKhau: validateField('matKhau', values.matKhau),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error !== '')) return;

    try {
      await api.post('/auth/dang-ky', values);
      setSuccessMsg('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => nav('/dang-nhap'), 1500);
    } catch (ex) {
      const serverMsg = ex.response?.data?.message || ex.response?.data?.errors?.[0]?.msg;
      setServerError(serverMsg || 'Đăng ký thất bại, vui lòng thử lại');
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Tạo tài khoản</h2>
        <p className="auth-subtitle">Bắt đầu quản lý chi tiêu của bạn</p>
        <form onSubmit={submit} noValidate>
          <div className={`md-input ${errors.email ? 'has-error' : ''}`}>
            <input id="email-reg" name="email" value={values.email} onChange={handleChange} onBlur={handleBlur} required />
            <label htmlFor="email-reg">Email</label>
          </div>
          {errors.email && <div className="inline-error">{errors.email}</div>}

          <div className={`md-input ${errors.hoTen ? 'has-error' : ''}`}>
            <input id="name-reg" name="hoTen" value={values.hoTen} onChange={handleChange} onBlur={handleBlur} required />
            <label htmlFor="name-reg">Họ và tên</label>
          </div>
          {errors.hoTen && <div className="inline-error">{errors.hoTen}</div>}

          <div className={`md-input ${errors.matKhau ? 'has-error' : ''}`}>
            <input id="pass-reg" type="password" name="matKhau" value={values.matKhau} onChange={handleChange} onBlur={handleBlur} required />
            <label htmlFor="pass-reg">Mật khẩu</label>
          </div>
          {errors.matKhau && <div className="inline-error">{errors.matKhau}</div>}

          {serverError && <div className="error-message">{serverError}</div>}
          {successMsg && <div className="success-message">{successMsg}</div>}
          <button className="md-btn primary" type="submit">
            <span className="material-symbols-rounded">person_add</span> Tạo tài khoản
          </button>
        </form>
        <p className="auth-switch">Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link></p>
      </div>
    </div>
  )
}