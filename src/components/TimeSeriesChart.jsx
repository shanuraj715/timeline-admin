import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../context/ThemeContext";
import { formatDate, formatCompactNumber } from "../lib/format";

// Single-series time-series chart. Per the dataviz skill: a single series
// needs no legend (the card title already names it), a 2px line with a
// ~10% opacity area wash beneath it, hairline recessive gridlines, and a
// hover tooltip. Sequential blue hue — the dataviz skill's validated
// palette values (run `node validate_palette.js` to reproduce): the
// light value passes as-is, but this app's own --primary dark value
// (#3b9eff, L=0.688) failed the dark lightness band [0.48-0.67], so dark
// mode uses the skill's own validated dark-blue step (#3987e5, L=0.60)
// instead. Recharts needs a literal color, not a CSS var, for SVG stroke/fill.
const HUE = { light: "#0a84ff", dark: "#3987e5" };

function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-[var(--shadow)]">
      <p className="text-text-muted">{formatDate(label)}</p>
      <p className="font-semibold text-text">{valueFormatter(payload[0].value)}</p>
    </div>
  );
}

export function TimeSeriesChart({ data, dataKey, valueFormatter = formatCompactNumber, height = 220 }) {
  const { theme } = useTheme();
  const color = HUE[theme] || HUE.light;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-text-muted" style={{ height }}>
        No data in this period.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.1} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatCompactNumber}
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ stroke: "var(--border)" }} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#fill-${dataKey})`}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: "var(--surface)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
