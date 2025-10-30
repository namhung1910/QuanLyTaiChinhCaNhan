import { useEffect, useState } from 'react';
import { api } from '../api';
import Card from '../components/Card';
import Modal from '../components/Modal';
import './DanhMuc.css';

// Trạng thái mặc định cho form, giúp reset dễ dàng
const INITIAL_FORM_STATE = { ten: '', loai: 'chi', moTa: '' };

export default function DanhMuc() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [editingItem, setEditingItem] = useState(null); // Dùng một state để quản lý cả ID và dữ liệu đang sửa
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    api.get('/danh-muc').then(r => setItems(r.data));
  }, []);
  
  // Hàm xử lý chung cho cả Thêm và Sửa
  const handleSubmit = async () => {
    if (!form.ten.trim()) {
      alert('Tên danh mục không được để trống');
      return;
    }

    try {
      if (editingItem) {
        // Chế độ Sửa
        const { data } = await api.put('/danh-muc/' + editingItem._id, form);
        setItems(items.map(i => (i._id === editingItem._id ? data : i)));
      } else {
        // Chế độ Thêm
        const { data } = await api.post('/danh-muc', form);
        setItems([data, ...items]);
      }
      closeModal(); // Đóng và reset modal sau khi thành công
    } catch (error) {
      console.error("Lỗi khi lưu danh mục:", error);
      alert("Đã xảy ra lỗi, vui lòng thử lại.");
    }
  };
  
  const del = async (id) => {
    await api.delete('/danh-muc/' + id);
    setItems(items.filter(i => i._id !== id));
  };
  
  // Mở modal ở chế độ sửa
  const startEdit = (item) => {
    setEditingItem(item);
    setForm({ ten: item.ten, loai: item.loai, moTa: item.moTa || '' });
    setIsModalOpen(true);
  };
  
  // Mở modal ở chế độ thêm mới
  const openAddModal = () => {
    setEditingItem(null);
    setForm(INITIAL_FORM_STATE);
    setIsModalOpen(true);
  };
  
  // Đóng và reset trạng thái modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm(INITIAL_FORM_STATE);
  };

  return (
    <div>
      <div className="md-card">
        <div className="md-card-header">Danh mục</div>
        <div className="md-card-content">
          <div className="add-button-container">
            <button className="md-btn" onClick={openAddModal}>
              <span className="material-symbols-rounded">add</span> Thêm danh mục
            </button>
          </div>
          
          <div className="cards-grid">
            {items.map(i => (
              <Card
                key={i._id}
                title={i.ten}
                description={i.moTa}
                type={i.loai}
                isDefault={true}
                onEdit={() => startEdit(i)}
                onDelete={() => del(i._id)}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Sử dụng một Modal duy nhất cho cả Thêm và Sửa */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={editingItem ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
        size="medium"
      >
        <div className="modal-form">
          <div className="form-group">
            <label>Tên danh mục *</label>
            <input 
              placeholder="Nhập tên danh mục" 
              value={form.ten} 
              onChange={e => setForm({...form, ten: e.target.value})} 
            />
          </div>
          
          <div className="form-group">
            <label>Loại danh mục</label>
            <select value={form.loai} onChange={e => setForm({...form, loai: e.target.value})}>
              <option value="chi">Chi tiêu</option>
              <option value="thu">Thu nhập</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Mô tả</label>
            <input 
              placeholder="Mô tả (tùy chọn)" 
              value={form.moTa} 
              onChange={e => setForm({...form, moTa: e.target.value})} 
            />
          </div>
          
          <div className="modal-actions">
            <button className="modal-btn modal-btn-secondary" onClick={closeModal}>
              <span className="material-symbols-rounded">close</span> Hủy
            </button>
            <button className="modal-btn modal-btn-primary" onClick={handleSubmit}>
              <span className="material-symbols-rounded">{editingItem ? 'save' : 'add'}</span> 
              {editingItem ? 'Lưu thay đổi' : 'Thêm danh mục'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}