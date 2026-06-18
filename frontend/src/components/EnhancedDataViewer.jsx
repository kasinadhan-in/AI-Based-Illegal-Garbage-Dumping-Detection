import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, ReferenceLine, Brush
} from 'recharts'
import { Download, Filter, Calendar, TrendingUp, AlertTriangle, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import { useTheme } from '../ThemeContext'

export default function EnhancedDataViewer({ detections }) {
  const { theme } = useTheme()
  const [activeChart, setActiveChart] = useState('timeline')
  const [timeRange, setTimeRange] = useState('all')
  const [filteredData, setFilteredData] = useState([])

  const isDark = theme === 'dark'

  useEffect(() => {
    if (!detections.length) return

    let data = [...detections]
    
    // Apply time range filter
    if (timeRange !== 'all') {
      const limit = parseInt(timeRange)
      data = data.slice(-limit)
    }

    // Process data for charts
    const processedData = data.map((d, index) => ({
      ...d,
      frame: parseInt(d.frame),
      time: parseFloat(d.time),
      confidence: parseFloat(d.confidence) * 100,
      isAlert: d.action === 'Dumping Detected' ? 100 : 0,
      color: d.action === 'Dumping Detected' ? '#EF4444' : '#10B981',
      size: d.action === 'Dumping Detected' ? 10 : 6
    }))

    setFilteredData(processedData)
  }, [detections, timeRange])

  const chartData = filteredData.map(d => ({
    name: `Frame ${d.frame}`,
    time: d.time,
    confidence: d.confidence,
    isAlert: d.isAlert,
    action: d.action
  }))

  // Calculate statistics
  const stats = {
    total: filteredData.length,
    alerts: filteredData.filter(d => d.action === 'Dumping Detected').length,
    avgConfidence: (filteredData.reduce((acc, d) => acc + d.confidence, 0) / filteredData.length || 0).toFixed(1),
    maxConfidence: Math.max(...filteredData.map(d => d.confidence), 0).toFixed(1),
    minConfidence: Math.min(...filteredData.map(d => d.confidence), 0).toFixed(1)
  }

  // Action distribution for pie chart
  const actionDistribution = filteredData.reduce((acc, d) => {
    acc[d.action] = (acc[d.action] || 0) + 1
    return acc
  }, {})

  const pieData = Object.entries(actionDistribution).map(([name, value], index) => ({
    name,
    value,
    color: name === 'Dumping Detected' ? '#EF4444' : 
           name === 'Normal Action' ? '#10B981' : 
           '#F59E0B'
  }))

  // Time-based distribution
  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
    const hourData = filteredData.filter(d => {
      const time = parseFloat(d.time)
      return Math.floor(time / 3600) === hour
    })
    return {
      hour: `${hour}:00`,
      detections: hourData.length,
      alerts: hourData.filter(d => d.action === 'Dumping Detected').length
    }
  })

  const COLORS = ['#0EA5E9', '#A855F7', '#EC4899', '#10B981', '#F59E0B', '#EF4444']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Advanced visualization and analysis of detection data</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm"
          >
            <option value="all">All Time</option>
            <option value="50">Last 50 Frames</option>
            <option value="100">Last 100 Frames</option>
            <option value="200">Last 200 Frames</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Frames', value: stats.total, icon: '📊', color: 'from-blue-500 to-cyan-500' },
          { label: 'Alert Events', value: stats.alerts, icon: '⚠️', color: 'from-red-500 to-pink-500' },
          { label: 'Avg Confidence', value: `${stats.avgConfidence}%`, icon: '🎯', color: 'from-green-500 to-emerald-500' },
          { label: 'Max Confidence', value: `${stats.maxConfidence}%`, icon: '📈', color: 'from-purple-500 to-violet-500' },
          { label: 'Min Confidence', value: `${stats.minConfidence}%`, icon: '📉', color: 'from-amber-500 to-orange-500' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="card relative overflow-hidden group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                </div>
                <div className="text-3xl opacity-30 group-hover:opacity-100 transition-opacity">
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4 h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`h-full bg-gradient-to-r ${stat.color}`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart Type Selector */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Visualization</h3>
          <div className="flex gap-2">
            {[
              { id: 'timeline', label: 'Timeline', icon: TrendingUp },
              { id: 'distribution', label: 'Distribution', icon: BarChart3 },
              { id: 'pie', label: 'Breakdown', icon: PieChartIcon },
              { id: 'scatter', label: 'Scatter', icon: AlertTriangle }
            ].map((chart) => {
              const Icon = chart.icon
              return (
                <button
                  key={chart.id}
                  onClick={() => setActiveChart(chart.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeChart === chart.id
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {chart.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {activeChart === 'timeline' && (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? '#374151' : '#E5E7EB'} 
                  />
                  <XAxis 
                    dataKey="time" 
                    stroke={isDark ? '#9CA3AF' : '#6B7280'}
                    label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    stroke={isDark ? '#9CA3AF' : '#6B7280'}
                    label={{ value: 'Confidence (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="#0EA5E9" 
                    fill="url(#confidenceGradient)"
                    name="Confidence %"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="isAlert" 
                    stroke="#EF4444" 
                    fill="url(#alertGradient)"
                    name="Alert Level"
                    strokeWidth={2}
                  />
                  <Brush dataKey="time" height={30} stroke="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === 'distribution' && (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                  <XAxis 
                    dataKey="hour" 
                    stroke={isDark ? '#9CA3AF' : '#6B7280'}
                  />
                  <YAxis 
                    stroke={isDark ? '#9CA3AF' : '#6B7280'}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="detections" fill="#0EA5E9" name="Total Detections" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="alerts" fill="#EF4444" name="Alert Events" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === 'pie' && (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                    formatter={(value, name, props) => [`${value} frames`, props.payload.name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === 'scatter' && (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                  <XAxis 
                    type="number" 
                    dataKey="time" 
                    name="Time" 
                    stroke={isDark ? '#9CA3AF' : '#6B7280'}
                    label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="confidence" 
                    name="Confidence" 
                    stroke={isDark ? '#9CA3AF' : '#6B7280'}
                    label={{ value: 'Confidence (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <ZAxis type="number" dataKey="size" range={[50, 400]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                    formatter={(value, name, props) => {
                      if (name === 'Confidence') return [`${value}%`, name]
                      if (name === 'Time') return [`${value}s`, name]
                      return [value, name]
                    }}
                  />
                  <Legend />
                  <Scatter name="Normal Actions" data={filteredData.filter(d => d.action !== 'Dumping Detected')} fill="#10B981">
                    {filteredData
                      .filter(d => d.action !== 'Dumping Detected')
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#10B981" opacity={0.6} />
                      ))
                    }
                  </Scatter>
                  <Scatter name="Alert Events" data={filteredData.filter(d => d.action === 'Dumping Detected')} fill="#EF4444">
                    {filteredData
                      .filter(d => d.action === 'Dumping Detected')
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#EF4444" opacity={0.8} />
                      ))
                    }
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Detection Records</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredData.length} records
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Frame</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Time (s)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Action</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Confidence</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
              {filteredData.slice(0, 10).map((detection, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    #{detection.frame}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {detection.time.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                      detection.action === 'Dumping Detected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {detection.action === 'Dumping Detected' ? '⚠️' : '✅'}
                      {detection.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${detection.confidence}%` }}
                          transition={{ duration: 1, delay: index * 0.05 }}
                          className={`h-full ${
                            detection.confidence > 90 ? 'bg-green-500' :
                            detection.confidence > 70 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {detection.confidence.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-xs font-medium px-2 py-1 rounded ${
                      detection.action === 'Dumping Detected'
                        ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                        : 'bg-green-500/10 text-green-700 dark:text-green-300'
                    }`}>
                      {detection.action === 'Dumping Detected' ? 'ALERT' : 'NORMAL'}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing 10 of {filteredData.length} records
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm">
              Previous
            </button>
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm">
              2
            </button>
            <button className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Performance Summary</h4>
          <div className="space-y-4">
            {[
              { label: 'Detection Rate', value: '94.2%', color: 'bg-green-500' },
              { label: 'False Positives', value: '2.8%', color: 'bg-yellow-500' },
              { label: 'Response Time', value: '1.2s', color: 'bg-blue-500' },
              { label: 'System Uptime', value: '99.8%', color: 'bg-purple-500' }
            ].map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                </div>
                <div className="h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: item.value.replace('%', '') + '%' }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`h-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}