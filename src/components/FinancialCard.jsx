import './FinancialCard.css';

// Một object đơn giản để map `type` với icon mặc định
const typeToIconMap = {
  income: 'trending_up',
  expense: 'trending_down',
  balance: 'account_balance_wallet',
  default: 'info',
};

export default function FinancialCard({ 
  type, 
  amount, 
  label, 
  icon,
  trend = null,
  trendValue = null 
}) {
  // Ưu tiên icon được truyền vào, nếu không có thì dùng icon mặc định theo type
  const displayIcon = icon || typeToIconMap[type] || typeToIconMap.default;

  return (
    <div className="financial-card" data-type={type}>
      <div className="financial-card__container">
        {/* Icon Section */}
        <div className="financial-card__icon-section">
          <div className="financial-card__icon-wrapper">
            <span className="material-symbols-rounded financial-card__icon">
              {displayIcon}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="financial-card__content">
          <div className="financial-card__amount">
            {amount.toLocaleString()} VNĐ
          </div>
          <div className="financial-card__label">
            {label}
          </div>
          
          {/* Trend indicator (optional) */}
          {trend && trendValue && (
            <div className={`financial-card__trend financial-card__trend--${trend}`}>
              <span className="material-symbols-rounded">
                {trend === 'up' ? 'arrow_upward' : 'arrow_downward'}
              </span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="financial-card__decoration">
          <div className="financial-card__accent" />
        </div>
      </div>
    </div>
  );
}