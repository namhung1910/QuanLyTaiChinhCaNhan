import { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import Card from '../components/Card';
import Modal from '../components/Modal';
import './NganSach.css';

const INITIAL_FORM_STATE = { danhMuc: '', soTienGioiHan: '', kyHan: 'thang' };

// --- Hàm tiện ích ---
const isBudgetExpired = (budget) => {
  const now = new Date();
  const createdAt = budget.createdAt ? new Date(budget.createdAt) : now;

  if (budget.kyHan === 'tuan') {
    const getWeekStart = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Thứ hai là ngày bắt đầu tuần
      return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
    };
    return getWeekStart(createdAt) < getWeekStart(now);
  }
  if (budget.kyHan === 'nam') {
    return createdAt.getFullYear() < now.getFullYear();
  }
  // Mặc định là kỳ hạn theo tháng
  return createdAt.getFullYear() < now.getFullYear() || (createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() < now.getMonth());
};

const getRemainingDays = (kyHan) => {
  const now = new Date();
  let endDate;
  if (kyHan === 'tuan') {
    const dayOfWeek = now.getDay();
    const daysUntilSunday = 7 - (dayOfWeek === 0 ? 7 : dayOfWeek);
    endDate = new Date(now);
    endDate.setDate(now.getDate() + daysUntilSunday);
  } else if (kyHan === 'nam') {
    endDate = new Date(now.getFullYear(), 11, 31);
  } else { // thang
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  endDate.setHours(23, 59, 59, 999);
  return Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
};
// --- Kết thúc hàm tiện ích ---

export default function NganSach() {
  const [items, setItems] = useState([]);
  const [danhMuc, setDanhMuc] = useState([]);
  const [canhBao, setCanhBao] = useState([]);
  const [expiredBudgets, setExpiredBudgets] = useState([]);
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = () => {
    Promise.all([api.get('/ngan-sach'), api.get('/danh-muc'), api.get('/ngan-sach/canh-bao')])
      .then(([budgetsRes, categoriesRes, warningsRes]) => {
        setDanhMuc(categoriesRes.data);
        setCanhBao(warningsRes.data);

        const active = [];
        const expired = [];
        (budgetsRes.data || []).forEach(budget => {
          if (isBudgetExpired(budget)) {
            expired.push(budget);
          } else {
            active.push(budget);
          }
        });

        setItems(active);

        const today = new Date().toDateString();
        const lastCheck = localStorage.getItem('lastBudgetCheck');
        if (expired.length > 0 && lastCheck !== today) {
          setExpiredBudgets(expired);
          setShowRenewalDialog(true);
          localStorage.setItem('lastBudgetCheck', today);
        }
      })
      .catch(err => console.error('Lỗi tải dữ liệu:', err));
  };

  useEffect(() => {
    loadData();
    const onChanged = () => loadData();
    window.addEventListener('data:changed', onChanged);
    return () => window.removeEventListener('data:changed', onChanged);
  }, []);
  
  const refreshData = () => window.dispatchEvent(new CustomEvent('data:changed'));

  const handleSubmit = async () => {
    if (!form.danhMuc) { alert('Hãy chọn danh mục'); return; }
    if (!form.soTienGioiHan || Number(form.soTienGioiHan) <= 0) { alert('Giới hạn phải > 0'); return; }
    
    const body = { ...form, soTienGioiHan: Number(form.soTienGioiHan) };

    try {
      const apiCall = editingItem
        ? api.put('/ngan-sach/' + editingItem._id, body)
        : api.post('/ngan-sach', body);
      
      await apiCall;
      closeModal();
      refreshData();
    } catch (err) {
      alert(err.response?.data?.message || 'Đã xảy ra lỗi');
    }
  };

  const del = async (id) => {
    await api.delete('/ngan-sach/' + id);
    refreshData();
  };
  
  const handleRenewal = async (renew = true) => {
    try {
      const deletePromises = expiredBudgets.map(b => api.delete('/ngan-sach/' + b._id));
      await Promise.all(deletePromises);
      
      if (renew) {
        const createPromises = expiredBudgets.map(b => api.post('/ngan-sach', {
          danhMuc: b.danhMuc?._id,
          soTienGioiHan: b.soTienGioiHan,
          kyHan: b.kyHan
        }));
        await Promise.all(createPromises);
      }
      
      alert(renew ? 'Đã gia hạn tất cả ngân sách.' : 'Đã xóa tất cả ngân sách hết hạn.');
    } catch (err) {
      alert('Đã có lỗi xảy ra: ' + (err.response?.data?.message || err.message));
    } finally {
      setShowRenewalDialog(false);
      setExpiredBudgets([]);
      refreshData();
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setForm(INITIAL_FORM_STATE);
    setIsModalOpen(true);
  };
  
  const startEdit = (item) => {
    setEditingItem(item);
    setForm({ danhMuc: item.danhMuc?._id || '', soTienGioiHan: item.soTienGioiHan, kyHan: item.kyHan });
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm(INITIAL_FORM_STATE);
  };

  const expenseCategories = useMemo(() => danhMuc.filter(d => d.loai === 'chi'), [danhMuc]);
  
  return (
    <div>
      {/* Hộp thoại gia hạn ngân sách */}
      {showRenewalDialog && (
        <div className="renewal-dialog-overlay">
          <div className="renewal-dialog">
            <div className="renewal-dialog-header"><span className="material-symbols-rounded">schedule</span><h3>Ngân sách hết hạn</h3></div>
            <div className="renewal-dialog-content">
              <p>{expiredBudgets.length} kỳ hạn của bạn đã kết thúc. Bạn có muốn gia hạn lại tất cả không?</p>
              <div className="expired-list">
                {expiredBudgets.map(b => (
                  <div key={b._id} className="expired-item">
                    <span>{b.danhMuc?.ten || 'Không rõ'}</span>
                    <span>{(b.soTienGioiHan || 0).toLocaleString()} VNĐ</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="renewal-dialog-actions">
              <button className="md-btn text" onClick={() => handleRenewal(false)}><span className="material-symbols-rounded">close</span> Không</button>
              <button className="md-btn" onClick={() => handleRenewal(true)}><span className="material-symbols-rounded">check</span> Có, gia hạn</button>
            </div>
          </div>
        </div>
      )}
 
      <div className="md-card">
        <div className="md-card-header">Ngân sách</div>
        <div className="md-card-content">
          <div className="action-buttons-container">
            <button className="md-btn" onClick={openAddModal}><span className="material-symbols-rounded">add</span> Thêm ngân sách</button>
            <button className="md-btn text btn-refresh" onClick={() => { localStorage.removeItem('lastBudgetCheck'); loadData(); }}>
              <span className="material-symbols-rounded">refresh</span> Kiểm tra lại kỳ hạn
            </button>
          </div>
          
          <div className="cards-grid">
            {items.map(i => {
              const percent = Math.min(100, Math.round((i.tiLe || 0) * 100));
              const progressClass = percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : '';
              return (
                <Card key={i._id} title={i.danhMuc?.ten} description={`Giới hạn: ${i.soTienGioiHan.toLocaleString()} VNĐ / ${i.kyHan}`} onEdit={() => startEdit(i)} onDelete={() => del(i._id)}>
                  <div className="budget-progress">
                    <div className="budget-stats">
                      <span>Đã chi: {(i.daChi || 0).toLocaleString()} VNĐ</span>
                      <span className="remaining-days">Còn {getRemainingDays(i.kyHan)} ngày</span>
                      <span className={`budget-percentage ${progressClass}`}>{percent}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className={`progress-fill ${progressClass}`} style={{width: `${percent}%`}} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          <h3 className="warnings-header">Cảnh báo</h3>
          <div className="cards-grid">
            {canhBao.length > 0 ? canhBao.map(w => (
              // SỬA LỖI: Truy cập trực tiếp vào 'w' thay vì 'w.nganSach'
              // và dùng key mới để tránh trùng lặp
              <Card 
                key={`warning-${w._id}`} 
                title={w.danhMuc?.ten} 
                description={`Đã chi ${w.daChi.toLocaleString()} / ${w.soTienGioiHan.toLocaleString()} VNĐ`} 
                className="warning-card" 
                showActions={false}
              >
                <div className="warning-percentage">
                  <span className="material-symbols-rounded">warning</span>
                  {Math.round(w.tiLe * 100)}% - {w.tiLe >= 1 ? 'Vượt quá giới hạn' : 'Gần đạt giới hạn'}
                </div>
              </Card>
            )) : (
              <div className="no-warnings">
                <span className="material-symbols-rounded">check_circle</span>
                <p>Không có cảnh báo nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hộp thoại thêm/chỉnh sửa ngân sách */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? "Chỉnh sửa ngân sách" : "Thêm ngân sách mới"} size="medium">
        <div className="modal-form">
          <div className="form-group">
            <label>Danh mục *</label>
            <select value={form.danhMuc} onChange={e => setForm({ ...form, danhMuc: e.target.value })}>
              <option value="">--Chọn danh mục--</option>
              {expenseCategories.map(d => <option key={d._id} value={d._id}>{d.ten}</option>)}
            </select>
            {danhMuc.length === 0 && <div className="form-hint loading">Đang tải danh mục...</div>}
            {danhMuc.length > 0 && expenseCategories.length === 0 && <div className="form-hint warning">Chưa có danh mục chi tiêu nào.</div>}
          </div>
          <div className="form-row">
            <div className="form-group"><label>Giới hạn ngân sách *</label><input type="number" placeholder="Nhập số tiền" value={form.soTienGioiHan} onChange={e => setForm({ ...form, soTienGioiHan: e.target.value })}/></div>
            <div className="form-group"><label>Kỳ hạn</label><select value={form.kyHan} onChange={e => setForm({ ...form, kyHan: e.target.value })}><option value="thang">Tháng</option><option value="tuan">Tuần</option><option value="nam">Năm</option></select></div>
          </div>
          <div className="modal-actions">
            <button className="modal-btn modal-btn-secondary" onClick={closeModal}><span className="material-symbols-rounded">close</span> Hủy</button>
            <button className="modal-btn modal-btn-primary" onClick={handleSubmit}><span className="material-symbols-rounded">{editingItem ? 'save' : 'add'}</span> {editingItem ? 'Lưu' : 'Thêm'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
