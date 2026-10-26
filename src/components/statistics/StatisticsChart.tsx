import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartPoint } from "../../types/statistics";

interface StatisticsChartProps {
  data: ChartPoint[];
}

export default function StatisticsChart({ data }: StatisticsChartProps) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: -20,
            bottom: 5,
          }}
        >
          <CartesianGrid
            vertical={false}
            stroke="#6b7280"
            strokeOpacity={0.15}
          />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: "#9ca3af",
            }}
            interval={data.length > 10 ? Math.ceil(data.length / 8) - 1 : 0}
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: "#9ca3af",
            }}
          />

          <Tooltip
            formatter={(value) => [`${value ?? 0} 🍅`, "Помодоро"]}
            contentStyle={{
              backgroundColor: "#202127",
              border: "1px solid #383a43",
              borderRadius: "12px",
              color: "#ffffff",
            }}
          />

          <Bar
            dataKey="pomodoros"
            fill="#ff503b"
            radius={[6, 6, 0, 0]}
            maxBarSize={35}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
