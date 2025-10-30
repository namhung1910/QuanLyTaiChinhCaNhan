import { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import Card from '../components/Card';
import Modal from '../components/Modal';
import FinancialCard from '../components/FinancialCard';
import './GiaoDich.css';

const PAGE_SIZE = 15;
const INITIAL_FORM_STATE = { soTien: '', loai: 'chi', danhMuc: '', ngay: '', ghiChu: '', the: '' };

export default function GiaoDich() {
  const [items, setItems] = useState([]);
  const [danhMuc, setDanhMuc] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [filters, setFilters] = useState({ loai: '', danhMuc: '', tuNgay: '', denNgay: '', min: '', max: '', q: '', the: '' });
  const [balance, setBalance] = useState({ tongThu: 0, tongChi: 0, soDuHienTai: 0 });
  const [monthlyBalance, setMonthlyBalance] = useState({ tongThu: 0, tongChi: 0, soDuHienTai: 0 });
  const [showAllTime, setShowAllTime] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const loadData = () => {
    Promise.all([
      api.get('/giao-dich'),
      api.get('/danh-muc'),
      api.get('/bao-cao/so-du'),
      api.get('/tong-quan-thang/current')
    ])
    .then(([transactions, categories, balanceData, monthlyData]) => {
      setItems(transactions.data);
      setDanhMuc(categories.data);
      setBalance(balanceData.data);
      
      if (monthlyData.data) {
        setMonthlyBalance({
          tongThu: monthlyData.data.thuNhap,
          tongChi: monthlyData.data.chiTieu,
          soDuHienTai: monthlyData.data.soDuHienTai
        });
      } else {
        setMonthlyBalance({ tongThu: 0, tongChi: 0, soDuHienTai: balanceData.data.soDuHienTai });
      }
    })
    .catch(err => console.error(err));
  };

  useEffect(() => { loadData(); }, []);

  // Helper function to refresh data and notify other components
  const refreshData = () => {
    loadData();
    window.dispatchEvent(new CustomEvent('data:changed'));
  };
  
  const handleFormSubmit = async () => {
    if (!form.soTien || Number(form.soTien) <= 0) { alert('Số tiền phải > 0'); return; }
    if (!form.danhMuc) { alert('Hãy chọn danh mục'); return; }

    const body = {
      ...form,
      soTien: Number(form.soTien),
      the: form.the ? form.the.split(',').map(t => t.trim()) : []
    };

    const apiCall = editingItem
      ? api.put('/giao-dich/' + editingItem._id, body)
      : api.post('/giao-dich', body);

    await apiCall;
    closeAddModal();
    refreshData();
  };
  
  const del = async (id) => {
    await api.delete('/giao-dich/' + id);
    refreshData();
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setForm({
      soTien: item.soTien.toString(),
      loai: item.loai,
      danhMuc: item.danhMuc?._id || '',
      ngay: new Date(item.ngay).toISOString().split('T')[0],
      ghiChu: item.ghiChu || '',
      the: Array.isArray(item.the) ? item.the.join(', ') : ''
    });
    setShowAddModal(true);
  };

  const search = async () => {
    const params = { ...filters };
    if (params.the) params.the = params.the.split(',').map(t => t.trim()).join(',');
    const { data } = await api.get('/giao-dich', { params });
    setItems(data);
    setShowSearchModal(false);
  };
  
  // Handlers for Modals and Forms
  const openAddModal = (type) => {
    setForm(prev => ({ ...INITIAL_FORM_STATE, loai: type }));
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setForm(INITIAL_FORM_STATE);
  };

  // Memoize the list to be displayed
  const displayedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => new Date(b.ngay) - new Date(a.ngay));
    return showAll ? sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : sorted.slice(0, 6);
  }, [items, showAll, page]);

  const toCSV = () => {
    const header = ['Ngay', 'Loai', 'SoTien', 'DanhMuc', 'GhiChu', 'The'];
    const rows = items.map(i => [
      new Date(i.ngay).toISOString().slice(0, 10),
      i.loai, i.soTien, i.danhMuc?.ten || '',
      (i.ghiChu || '').replaceAll(',', ';'), (i.the || []).join('|')
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'giao_dich.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Financial Overview */}
      <div className="md-card section-card">
        <div className="md-card-header">
          <span>Tổng quan tài chính</span>
          <button className="toggle-view-btn" onClick={() => setShowAllTime(!showAllTime)}>
            <span className="material-symbols-rounded">{showAllTime ? 'calendar_month' : 'history'}</span>
            {showAllTime ? 'Xem tháng này' : 'Xem toàn thời gian'}
          </button>
        </div>
        <div className="md-card-content">
          <div className="financial-overview-grid">
            <FinancialCard type="income" amount={showAllTime ? balance.tongThu : monthlyBalance.tongThu} label={showAllTime ? "Tổng thu nhập" : `Thu nhập tháng ${new Date().getMonth() + 1}`} icon="trending_up"/>
            <FinancialCard type="expense" amount={showAllTime ? balance.tongChi : monthlyBalance.tongChi} label={showAllTime ? "Tổng chi tiêu" : `Chi tiêu tháng ${new Date().getMonth() + 1}`} icon="trending_down"/>
            <FinancialCard type="balance" amount={balance.soDuHienTai} label="Số dư hiện tại" icon="account_balance_wallet"/>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="md-card section-card">
        <div className="md-card-header">Thao tác nhanh</div>
        <div className="md-card-content">
          <div className="quick-actions">
            <button className="quick-btn income" onClick={() => openAddModal('thu')}><span className="material-symbols-rounded">add</span> Thêm thu nhập</button>
            <button className="quick-btn expense" onClick={() => openAddModal('chi')}><span className="material-symbols-rounded">remove</span> Thêm chi tiêu</button>
            <button className="quick-btn export" onClick={toCSV}><span className="material-symbols-rounded">download</span> Xuất dữ liệu</button>
            <button className="quick-btn search" onClick={() => setShowSearchModal(true)}><span className="material-symbols-rounded">search</span> Tìm kiếm</button>
          </div>
        </div>
      </div>

      {/* Your Transactions */}
      <div className="md-card section-card">
        <div className="md-card-header transactions-header">
          <div className="transactions-header-title">Giao dịch của bạn</div>
          {items.length > 6 && (
            <button className="toggle-view-btn" onClick={() => { setShowAll(prev => !prev); setPage(1); }}>
              <span className="material-symbols-rounded">{showAll ? 'expand_less' : 'expand_more'}</span>
              {showAll ? 'Ẩn bớt' : 'Xem tất cả'}
            </button>
          )}
        </div>
        <div className="md-card-content">
          {items.length === 0
            ? <div className="empty-state">Chưa có giao dịch nào. Hãy thêm giao dịch đầu tiên của bạn!</div>
            : <div className="cards-grid transactions-list">
                {displayedItems.map(i => (
                  <Card key={i._id} title={`${i.soTien.toLocaleString()} VNĐ`} description={`${new Date(i.ngay).toLocaleDateString()} • ${i.danhMuc?.ten || 'Không có danh mục'}`} type={i.loai} onEdit={() => startEdit(i)} onDelete={() => del(i._id)}>
                    {(i.ghiChu || (Array.isArray(i.the) && i.the.length > 0)) && (
                      <div className="transaction-details">
                        {i.ghiChu && <div className="transaction-note">{i.ghiChu}</div>}
                        {Array.isArray(i.the) && i.the.length > 0 && (
                          <div className="transaction-tags">
                            {i.the.map((t, idx) => <span className="tag" key={idx}><span className="material-symbols-rounded">sell</span>{t}</span>)}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
          }
          {showAll && items.length > PAGE_SIZE && (
            <div className="pagination">
              <button className="nav" disabled={page === 1} onClick={() => setPage(p => p - 1)}>◄</button>
              {Array.from({ length: Math.ceil(items.length / PAGE_SIZE) }).map((_, idx) => (
                <button key={idx + 1} className={idx + 1 === page ? 'page active' : 'page'} onClick={() => setPage(idx + 1)}>{idx + 1}</button>
              ))}
              <button className="nav" disabled={page === Math.ceil(items.length / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>►</button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add/Edit Modal */}
      <Modal isOpen={showAddModal} onClose={closeAddModal} title={editingItem ? `Sửa giao dịch` : `Thêm giao dịch`} size="medium">
        <div className="modal-form">
          <div className="form-row">
            <div className="form-group"><label>Số tiền *</label><input type="number" placeholder="Nhập số tiền" value={form.soTien} onChange={e => setForm({ ...form, soTien: e.target.value })}/></div>
            <div className="form-group"><label>Loại giao dịch</label><select value={form.loai} onChange={e => setForm({ ...form, loai: e.target.value, danhMuc: '' })}><option value="chi">Chi tiêu</option><option value="thu">Thu nhập</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Danh mục *</label><select value={form.danhMuc} onChange={e => setForm({ ...form, danhMuc: e.target.value })}><option value="">--Chọn danh mục--</option>{danhMuc.filter(d => d.loai === form.loai).map(d => <option key={d._id} value={d._id}>{d.ten}</option>)}</select></div>
            <div className="form-group"><label>Ngày</label><input type="date" value={form.ngay} onChange={e => setForm({ ...form, ngay: e.target.value })}/></div>
          </div>
          <div className="form-group"><label>Ghi chú</label><textarea placeholder="Nhập ghi chú (tùy chọn)" value={form.ghiChu} onChange={e => setForm({ ...form, ghiChu: e.target.value })}/></div>
          <div className="form-group"><label>Thẻ</label><input placeholder="Nhập thẻ, phân tách bằng dấu phẩy" value={form.the} onChange={e => setForm({ ...form, the: e.target.value })}/></div>
          <div className="modal-actions">
            <button className="modal-btn modal-btn-secondary" onClick={closeAddModal}><span className="material-symbols-rounded">close</span> Hủy</button>
            <button className="modal-btn modal-btn-primary" onClick={handleFormSubmit}><span className="material-symbols-rounded">{editingItem ? 'save' : 'add'}</span> {editingItem ? 'Cập nhật' : 'Thêm'}</button>
          </div>
        </div>
      </Modal>
      
      {/* Search Modal */}
      <Modal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} title="Tìm kiếm giao dịch" size="large">
        <div className="modal-form">
          <div className="form-row">
            <div className="form-group"><label>Loại giao dịch</label><select value={filters.loai} onChange={e => setFilters({ ...filters, loai: e.target.value })}><option value="">Tất cả</option><option value="chi">Chi tiêu</option><option value="thu">Thu nhập</option></select></div>
            <div className="form-group"><label>Danh mục</label><select value={filters.danhMuc} onChange={e => setFilters({ ...filters, danhMuc: e.target.value })}><option value="">--Tất cả--</option>{danhMuc.map(d => <option key={d._id} value={d._id}>{d.ten}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Từ ngày</label><input type="date" value={filters.tuNgay} onChange={e => setFilters({ ...filters, tuNgay: e.target.value })}/></div>
            <div className="form-group"><label>Đến ngày</label><input type="date" value={filters.denNgay} onChange={e => setFilters({ ...filters, denNgay: e.target.value })}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Số tiền tối thiểu</label><input type="number" placeholder="VD: 100000" value={filters.min} onChange={e => setFilters({ ...filters, min: e.target.value })}/></div>
            <div className="form-group"><label>Số tiền tối đa</label><input type="number" placeholder="VD: 500000" value={filters.max} onChange={e => setFilters({ ...filters, max: e.target.value })}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Từ khóa ghi chú</label><input placeholder="Tìm trong ghi chú" value={filters.q} onChange={e => setFilters({ ...filters, q: e.target.value })}/></div>
            <div className="form-group"><label>Thẻ</label><input placeholder="Nhập thẻ, phân tách bằng dấu phẩy" value={filters.the} onChange={e => setFilters({ ...filters, the: e.target.value })}/></div>
          </div>
          <div className="modal-actions">
            <button className="modal-btn modal-btn-secondary" onClick={() => setShowSearchModal(false)}><span className="material-symbols-rounded">close</span> Hủy</button>
            <button className="modal-btn modal-btn-primary" onClick={search}><span className="material-symbols-rounded">search</span> Tìm kiếm</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}