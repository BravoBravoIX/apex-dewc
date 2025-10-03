export interface SignalDataPoint {
  timestamp: string;
  value: number; // 0-100
}

interface SignalHistoryChartProps {
  data: SignalDataPoint[];
  title?: string;
}

export const SignalHistoryChart = ({ data, title = 'Signal Strength History' }: SignalHistoryChartProps) => {
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (data.length === 0) {
    return (
      <section className="mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          </div>
          <div className="h-[300px] flex items-center justify-center text-text-secondary">
            No signal history data available
          </div>
        </div>
      </section>
    );
  }

  // Calculate points for the line
  const maxValue = 100;
  const minValue = 0;
  const valueRange = maxValue - minValue;

  const points = data.map((point, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
    return { x, y, value: point.value };
  });

  // Create path string
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Create area fill path
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100];

  // Get last few timestamps for x-axis
  const xLabels = data.length > 5
    ? [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]]
    : data;

  return (
    <section className="mb-8">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        </div>

        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            style={{ maxHeight: '300px' }}
          >
            {/* Grid lines */}
            {yLabels.map((label) => {
              const y = padding.top + chartHeight - (label / 100) * chartHeight;
              return (
                <g key={label}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="currentColor"
                    className="text-border opacity-30"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-text-muted text-xs"
                    fill="currentColor"
                  >
                    {label}%
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            <path
              d={areaPath}
              fill="url(#signalGradient)"
              opacity="0.2"
            />

            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              className="text-primary"
              strokeWidth="2"
            />

            {/* Points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="currentColor"
                className="text-primary"
              />
            ))}

            {/* X-axis labels */}
            {xLabels.map((point, index) => {
              const xPos = padding.left + (data.indexOf(point) / (data.length - 1 || 1)) * chartWidth;
              return (
                <text
                  key={index}
                  x={xPos}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  className="text-text-muted text-xs"
                  fill="currentColor"
                >
                  {point.timestamp}
                </text>
              );
            })}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="signalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="currentColor" className="text-primary" />
                <stop offset="100%" stopColor="currentColor" className="text-primary" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </section>
  );
};
