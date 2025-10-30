import { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import './BaoCao.css';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement, LineElement);

const formatVND = (value) => `${value.toLocaleString()} VNĐ`;

export default function BaoCao() {
  const [data, setData] = useState({ byLoai: [], topChi: [], timeSeries: [], meta: {} });
  const [mode, setMode] = useState('thang');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const loadData = () => {
    api.get('/bao-cao', { params: { mode, month, year } })
      .then(r => setData(r.data))
      .catch(err => console.error("Lỗi tải báo cáo:", err));
  };

  useEffect(() => {
    loadData();
    const onChanged = () => loadData();
    window.addEventListener('data:changed', onChanged);
    return () => window.removeEventListener('data:changed', onChanged);
  }, [mode, month, year]);

  const { pieChart, barChart, lineChart, netProfitChart } = useMemo(() => {
    const tongThu = data.byLoai.find(x => x._id === 'thu')?.tong || 0;
    const tongChi = data.byLoai.find(x => x._id === 'chi')?.tong || 0;
    const total = tongThu + tongChi;

    const pieChart = {
      data: {
        labels: ['Thu nhập', 'Chi tiêu'],
        datasets: [{
          data: [tongThu, tongChi],
          backgroundColor: ['#16a34a', '#dc2626'],
          borderWidth: 2, borderColor: '#fff', hoverOffset: 10,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
          tooltip: { callbacks: { label: (c) => `${c.label}: ${formatVND(c.parsed)} (${total > 0 ? ((c.parsed / total) * 100).toFixed(1) : 0}%)` } }
        }
      }
    };

    const barChart = {
      data: {
        labels: data.topChi.map(x => x.danhMuc?.ten || 'Khác'),
        datasets: [{
          label: 'Chi tiêu', data: data.topChi.map(x => x.tong),
          backgroundColor: '#dc2626', borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => formatVND(c.parsed.y) } } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatVND(v) } } }
      }
    };

    // === BIỂU ĐỒ MỚI: LỢI NHUẬN RÒNG ===
    const netProfitChart = {
      data: {
        labels: data.timeSeries.map(x => x.label),
        datasets: [{
          label: 'Lợi nhuận ròng',
          data: data.timeSeries.map(x => x.tongThu - x.tongChi),
          // Màu tự động thay đổi dựa trên giá trị (lãi/lỗ)
          backgroundColor: data.timeSeries.map(x => (x.tongThu - x.tongChi) >= 0 ? '#16a34a' : '#dc2626'),
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => formatVND(c.parsed.y) } } },
        scales: {
          y: {
            // beginAtZero phải là false để hiển thị được giá trị âm
            beginAtZero: false,
            ticks: { callback: (v) => formatVND(v) }
          }
        }
      }
    };

    const lineChart = {
      data: {
        labels: data.timeSeries.map(x => x.label),
        datasets: [
          {
            label: 'Thu nhập', data: data.timeSeries.map(x => x.tongThu),
            borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)',
            fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7, pointHitRadius: 10, cubicInterpolationMode: 'monotone',
          },
          {
            label: 'Chi tiêu', data: data.timeSeries.map(x => x.tongChi),
            borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)',
            fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7, pointHitRadius: 10, cubicInterpolationMode: 'monotone',
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top' }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatVND(c.parsed.y)}` } } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatVND(v) } } }
      }
    };

    return { pieChart, barChart, lineChart, netProfitChart };
  }, [data]);

  return (
    <div>
      <div className="md-card">
        <div className="md-card-header">
          <h2>Báo cáo tổng quan</h2>
          <p className="report-subtitle">Chọn khoảng thời gian để xem biểu đồ</p>
        </div>
        <div className="md-card-content">
          <div className="report-filters">
            <div className="filter-group">
              <label htmlFor="mode-select">Chế độ xem</label>
              <select id="mode-select" value={mode} onChange={e => setMode(e.target.value)}>
                <option value="tuan">Theo Tuần</option>
                <option value="thang">Theo Tháng</option>
                <option value="nam">Theo Năm</option>
              </select>
            </div>
            {mode !== 'nam' && (
              <div className="filter-group">
                <label htmlFor="month-select">Chọn tháng</label>
                <select id="month-select" value={month} onChange={e => setMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }).map((_, i) => <option key={i + 1} value={i + 1}>{`Tháng ${i + 1}`}</option>)}
                </select>
              </div>
            )}
            <div className="filter-group">
              <label htmlFor="year-input">Chọn năm</label>
              <input id="year-input" type="number" value={year} onChange={e => setYear(Number(e.target.value) || new Date().getFullYear())} />
            </div>
            <button className="update-btn" onClick={loadData}>
              <span className="material-symbols-rounded">refresh</span> Cập nhật
            </button>
          </div>
          
          <div className="charts-grid">
            <div className="chart-container">
              <h3 className="chart-title">Tỷ lệ Thu - Chi</h3>
              <div className="chart-wrapper"><Pie data={pieChart.data} options={pieChart.options} /></div>
            </div>
            <div className="chart-container">
              <h3 className="chart-title">Chi tiêu theo danh mục</h3>
              <div className="chart-wrapper"><Bar data={barChart.data} options={barChart.options} /></div>
            </div>
            {/* === THÊM BIỂU ĐỒ MỚI VÀO GIAO DIỆN === */}
            <div className="chart-container">
              <h3 className="chart-title">Lợi nhuận ròng (Lãi/Lỗ)</h3>
              <div className="chart-wrapper"><Bar data={netProfitChart.data} options={netProfitChart.options} /></div>
            </div>
            <div className="chart-container full-width">
              <h3 className="chart-title">Biến động dòng tiền</h3>
              <div className="chart-wrapper"><Line data={lineChart.data} options={lineChart.options} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}