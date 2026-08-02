import { motion } from 'motion/react'
import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  createDistributionData,
  formatNumber,
  type ProbabilityMode,
} from '../lib/statistics'

interface DistributionChartProps {
  mode: ProbabilityMode
  degrees: number
  criticalValue: number
}

interface TooltipPayload {
  payload?: { x: number; density: number }
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  return (
    <div className="border border-ink/15 bg-paper/95 px-3 py-2 text-[11px] shadow-sm backdrop-blur">
      <div className="font-semibold text-ink">t = {formatNumber(point.x, 3)}</div>
      <div className="mt-0.5 text-muted">밀도 {formatNumber(point.density, 4)}</div>
    </div>
  )
}

export function DistributionChart({ mode, degrees, criticalValue }: DistributionChartProps) {
  const data = useMemo(
    () => createDistributionData(mode, degrees, criticalValue),
    [mode, degrees, criticalValue],
  )
  const absoluteCritical = Math.abs(criticalValue)
  const markers = mode === 'two' ? [-absoluteCritical, absoluteCritical] : [criticalValue]

  return (
    <motion.div
      key={`${mode}-${degrees}-${criticalValue.toFixed(5)}`}
      initial={{ opacity: 0.55, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="h-[260px] w-full sm:h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 30, right: 14, bottom: 3, left: 2 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeOpacity={0.4} />
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickCount={5}
            axisLine={{ stroke: 'var(--line)' }}
            tickLine={false}
            tick={{ fill: 'var(--muted)', fontSize: 10 }}
            tickFormatter={(value: number) => formatNumber(value, 1)}
          />
          <YAxis hide domain={[0, 'dataMax + 0.02']} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--line)', strokeDasharray: '3 3' }} />
          <Area
            type="monotone"
            dataKey="shade"
            stroke="none"
            fill="var(--accent)"
            fillOpacity={0.3}
            isAnimationActive
            animationDuration={450}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="density"
            dot={false}
            stroke="var(--ink)"
            strokeWidth={2.2}
            isAnimationActive
            animationDuration={450}
          />
          {markers.map((marker) => (
            <ReferenceLine
              key={marker}
              x={marker}
              stroke="var(--accent)"
              strokeDasharray="5 5"
              label={{
                value: `t=${formatNumber(marker, 3)}`,
                position: marker < 0 ? 'insideTopLeft' : 'insideTopRight',
                fill: 'var(--accent)',
                fontSize: 10,
                fontWeight: 700,
              }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
