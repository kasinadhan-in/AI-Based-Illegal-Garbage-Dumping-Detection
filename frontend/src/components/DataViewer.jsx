import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useTheme } from "../ThemeContext";

export default function DataViewer() {
  const { theme } = useTheme()
  const [detections, setDetections] = useState([])
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    alerts: 0,
    avgConfidence: 0,
    dumpingPercentage: 0,
    recentAlerts: 0,
    noPoseEvents: 0
  })
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('all')
  const [selectedAction, setSelectedAction] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [detectionsRes, eventsRes, statsRes] = await Promise.all([
        fetch('/api/detections'),
        fetch('/api/events'),
        fetch('/api/stats')
      ])

      const detectionsData = await detectionsRes.json()
      const eventsData = await eventsRes.json()
      const statsData = await statsRes.json()

      setDetections(detectionsData)
      setEvents(eventsData)
      
      // Process stats from API response
      setStats({
        total: statsData.totalFrames || detectionsData.length,
        alerts: statsData.dumpingDetected || 0,
        avgConfidence: statsData.avgConfidence || 0,
        dumpingPercentage: statsData.dumpingPercentage || 0,
        recentAlerts: statsData.recentDumping || 0,
        noPoseEvents: statsData.noPoseDetected || 0
      })

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Process data based on filters
  const getFilteredData = () => {
    let filtered = [...detections]
    
    // Filter by time
    if (timeFilter === 'recent') {
      const now = Date.now()
      filtered = filtered.filter(d => {
        // Assuming timestamp logic - adjust based on your time format
        const detectionTime = parseFloat(d.time) * 1000
        return now - detectionTime < 3600000 // Last hour
      })
    }
    
    // Filter by action
    if (selectedAction !== 'all') {
      filtered = filtered.filter(d => d.action === selectedAction)
    }
    
    return filtered
  }

  const filteredDetections = getFilteredData()

  // Prepare chart data
  const chartData = filteredDetections.map(d => ({
    time: parseFloat(d.time).toFixed(1),
    confidence: (d.confidence * 100),
    isAlert: d.action === 'Dumping Detected' ? 100 : 0,
    action: d.action
  }))

  // Group by action type
  const actionCounts = filteredDetections.reduce((acc, d) => {
    acc[d.action] = (acc[d.action] || 0) + 1
    return acc
  }, {})

  const barData = Object.entries(actionCounts).map(([action, count]) => ({
    action: action.replace('Detected', '').trim(),
    count,
    percentage: (count / filteredDetections.length * 100).toFixed(1)
  }))

  // Prepare timeline data with alerts highlighted
  const timelineData = filteredDetections.slice(-20).map((d, i) => ({
    index: i,
    time: parseFloat(d.time).toFixed(1),
    confidence: (d.confidence * 100),
    alert: d.action === 'Dumping Detected' ? 1 : 0
  }))

  // Calculate hourly distribution
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourDetections = detections.filter(d => {
      const detectionHour = Math.floor(parseFloat(d.time || 0) / 3600)
      return detectionHour === hour
    })
    
    const hourAlerts = hourDetections.filter(d => 
      d.action === 'Dumping Detected'
    ).length
    
    return {
      hour: `${String(hour).padStart(2, '0')}:00`,
      detections: hourDetections.length,
      alerts: hourAlerts,
      alertRate: hourDetections.length > 0 ? 
        (hourAlerts / hourDetections.length * 100).toFixed(1) : 0
    }
  })

  const isDark = theme === 'dark'

  const handleExportCSV = () => {
    const csvContent = [
      ['Frame', 'Time (s)', 'Action', 'Confidence'],
      ...filteredDetections.map(d => [
        d.frame,
        parseFloat(d.time).toFixed(3),
        d.action,
        `${(d.confidence * 100).toFixed(1)}%`
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `detections_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading detection data...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6"
    >
      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Time Range
            </label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Time</option>
              <option value="recent">Last Hour</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Action Type
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="input-field"
            >
              <option value="all">All Actions</option>
              <option value="Dumping Detected">Dumping Detected</option>
              <option value="Normal Action">Normal Action</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={fetchData}
              className="btn-secondary flex-1"
            >
              ↻ Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="btn-primary flex-1"
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium opacity-90">Total Detections</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.total.toLocaleString()}</p>
          <p className="text-xs opacity-75 mt-1">{filteredDetections.length} filtered</p>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-red-500 to-rose-500 text-white"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium opacity-90">Alert Events</h3>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.alerts}</p>
          <p className="text-xs opacity-75 mt-1">{stats.dumpingPercentage}% of total</p>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-emerald-500 to-green-500 text-white"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium opacity-90">Avg Confidence</h3>
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.avgConfidence}%</p>
          <p className="text-xs opacity-75 mt-1">Based on {detections.length} detections</p>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-purple-500 to-pink-500 text-white"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium opacity-90">No Pose Events</h3>
            <span className="text-2xl">👤</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.noPoseEvents}</p>
          <p className="text-xs opacity-75 mt-1">From events data</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Timeline */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Confidence Timeline
            </h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Confidence</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-red-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Alerts</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="gradientConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
              <XAxis 
                dataKey="time" 
                stroke={isDark ? '#9CA3AF' : '#6B7280'}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke={isDark ? '#9CA3AF' : '#6B7280'}
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDark ? '#F8FAFC' : '#1F2937'
                }}
                formatter={(value, name) => {
                  if (name === 'confidence') return [`${value.toFixed(1)}%`, 'Confidence']
                  if (name === 'alert') return [value ? 'Alert' : 'Normal', 'Status']
                  return [value, name]
                }}
              />
              <Area
                type="monotone"
                dataKey="confidence"
                stroke="#3B82F6"
                fill="url(#gradientConfidence)"
                strokeWidth={2}
                name="Confidence"
              />
              <Line 
                type="stepAfter" 
                dataKey="alert" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Alert"
                dot={{ fill: '#EF4444', r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Action Distribution */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            Action Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
              <XAxis 
                dataKey="action" 
                stroke={isDark ? '#9CA3AF' : '#6B7280'}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke={isDark ? '#9CA3AF' : '#6B7280'}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDark ? '#F8FAFC' : '#1F2937'
                }}
                formatter={(value, name) => {
                  if (name === 'count') return [value, 'Count']
                  if (name === 'percentage') return [`${value}%`, 'Percentage']
                  return [value, name]
                }}
              />
              <Bar 
                dataKey="count" 
                fill="#22C55E" 
                name="Count"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {barData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 truncate">{item.action}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {item.count}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Activity */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          24-Hour Detection Pattern
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
            <XAxis 
              dataKey="hour" 
              stroke={isDark ? '#9CA3AF' : '#6B7280'}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              stroke={isDark ? '#9CA3AF' : '#6B7280'}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke={isDark ? '#9CA3AF' : '#6B7280'}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                borderRadius: '8px',
                color: isDark ? '#F8FAFC' : '#1F2937'
              }}
              formatter={(value, name) => {
                if (name === 'detections') return [value, 'Total Detections']
                if (name === 'alerts') return [value, 'Alerts']
                if (name === 'alertRate') return [`${value}%`, 'Alert Rate']
                return [value, name]
              }}
            />
            <Bar 
              dataKey="detections" 
              fill="#8B5CF6" 
              name="Total Detections"
              opacity={0.7}
            />
            <Bar 
              dataKey="alerts" 
              fill="#EF4444" 
              name="Alerts"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Detection Records
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredDetections.length} of {detections.length} records
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Frame</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Time (s)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Action</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {filteredDetections.slice(0, 15).map((detection, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {detection.frame}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {parseFloat(detection.time).toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      detection.action === 'Dumping Detected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : detection.action === 'Normal Action'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {detection.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            detection.confidence >= 0.9 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' :
                            detection.confidence >= 0.8 ? 'bg-gradient-to-r from-sky-500 to-cyan-500' :
                            'bg-gradient-to-r from-amber-500 to-orange-500'
                          }`}
                          style={{ width: `${detection.confidence * 100}%` }}
                        />
                      </div>
                      <span className={`font-medium ${
                        detection.confidence >= 0.9 ? 'text-emerald-600 dark:text-emerald-400' :
                        detection.confidence >= 0.8 ? 'text-sky-600 dark:text-sky-400' :
                        'text-amber-600 dark:text-amber-400'
                      }`}>
                        {(detection.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 flex justify-between items-center border-t border-gray-200 dark:border-slate-700 pt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredDetections.length > 15 ? (
              <>Showing first 15 of {filteredDetections.length} filtered records</>
            ) : (
              <>Showing all {filteredDetections.length} filtered records</>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setTimeFilter('all')
                setSelectedAction('all')
              }}
              className="btn-secondary text-sm"
            >
              Clear Filters
            </button>
            <button
              onClick={handleExportCSV}
              className="btn-primary text-sm"
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}