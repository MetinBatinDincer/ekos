const config = {
  normal: { label: 'Sorunsuz', bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
  risk:   { label: 'Dikkat',   bg: '#fef9c3', color: '#a16207', dot: '#eab308' },
  fault:  { label: 'Arıza',   bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
};

export default function StatusBadge({ status, size = 'md' }) {
  const c = config[status] || config.normal;
  const pad = size === 'sm' ? '2px 8px' : '4px 12px';
  const fs = size === 'sm' ? 11 : 12;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: pad, borderRadius: 999,
      background: c.bg, color: c.color,
      fontSize: fs, fontWeight: 600,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: c.dot,
        display: 'inline-block',
        ...(status !== 'normal' ? { animation: 'pulse-dot 2s ease-in-out infinite' } : {}),
      }} />
      {c.label}
    </span>
  );
}
