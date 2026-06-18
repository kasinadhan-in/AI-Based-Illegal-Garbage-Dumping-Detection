import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Download, Bell, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react'
import { useTheme } from '../ThemeContext'

export default function EnhancedAlertsManager() {
  const { theme } = useTheme()
  const [filters, setFilters] = useState({
    search: '',
    severity: 'all',
    status: 'all',
    camera: 'all',
    dateRange: 'today'
  })

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      timestamp: '2024-01-29 14:32:45',
      camera: 'Entrance Gate A',
      action: 'Dropping Garbage',
      severity: 'high',
      status: 'active',
      confidence: 98.5,
      duration: '2.3s',
      location: { x: 45, y: 120 },
      snapshot: '/snapshots/frame_1.jpg'
    },
    {
      id: 2,
      timestamp: '2024-01-29 14:28:12',
      camera: 'Side Corridor',
      action: 'Unusual Activity',
      severity: 'medium',
      status: 'resolved',
      confidence: 76.2,
      duration: '5.1s',
      location: { x: 320, y: 85 },
      snapshot: '/snapshots/frame_2.jpg'
    },
    {
      id: 3,
      timestamp: '2024-01-29 14:15:33',
      camera: 'Loading Dock',
      action: 'Dropping Garbage',
      severity: 'high',
      status: 'active',
      confidence: 94.8,
      duration: '1.8s',
      location: { x: 150, y: 220 },
      snapshot: '/snapshots/frame_3.jpg'
    },
    {
      id: 4,
      timestamp: '2024-01-29 14:05:22',
      camera: 'Parking Area',
      action: 'Person Loitering',
      severity: 'low',
      status: 'resolved',
      confidence: 82.3,
      duration: '45.2s',
      location: { x: 280, y: 180 },
      snapshot: '/snapshots/frame_4.jpg'
    },
    {
      id: 5,
      timestamp: '2024-01-29 13:48:19',
      camera: 'Main Street',
      action: 'Dropping Garbage',
      severity: 'high',
      status: 'active',
      confidence: 91.7,
      duration: '3.2s',
      location: { x: 95, y: 150 },
      snapshot: '/snapshots/frame_5.jpg'
    },
    {
      id: 6,
      timestamp: '2024-01-29 13:35:44',
      camera: 'Back Alley',
      action: 'Suspicious Activity',
      severity: 'medium',
      status: 'pending',
      confidence: 68.9,
      duration: '12.5s',
      location: { x: 400, y: 90 },
      snapshot: '/snapshots/frame_6.jpg'
    },
  ])

  const cameras = ['Entrance Gate A', 'Side Corridor', 'Loading Dock', 'Parking Area', 'Main Street', 'Back Alley']

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-500', icon: '🔴' }
      case 'medium':
        return { bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500', icon: '🟠' }
      case 'low':
        return { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500', icon: '🔵' }
      default:
        return { bg: 'bg-gray-500/10', text: 'text-gray-700', border: 'border-gray-500', icon: '⚪' }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: AlertTriangle }
      case 'resolved':
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: CheckCircle }
      case 'pending':
        return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', icon: Bell }
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300', icon: XCircle }
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.action.toLowerCase().includes(filters.search.toLowerCase()) ||
                          alert.camera.toLowerCase().includes(filters.search.toLowerCase())
    const matchesSeverity = filters.severity === 'all' || alert.severity === filters.severity
    const matchesStatus = filters.status === 'all' || alert.status === filters.status
    const matchesCamera = filters.camera === 'all' || alert.camera === filters.camera
    return matchesSearch && matchesSeverity && matchesStatus && matchesCamera
  })

  const stats = {
    total: filteredAlerts.length,
    active: filteredAlerts.filter(a => a.status === 'active').length,
    highSeverity: filteredAlerts.filter(a => a.severity === 'high').length,
    avgConfidence: (filteredAlerts.reduce((sum, a) => sum + a.confidence, 0) / filteredAlerts.length || 0).toFixed(1)
  }

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Alerts Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage all system alerts in real-time</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            <Bell className="w-4 h-4" />
            Configure
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Alerts', value: stats.total, color: 'from-blue-500 to-cyan-500', icon: '📈' },
          { label: 'Active Alerts', value: stats.active, color: 'from-red-500 to-pink-500', icon: '⚠️' },
          { label: 'High Severity', value: stats.highSeverity, color: 'from-amber-500 to-orange-500', icon: '🔥' },
          { label: 'Avg Confidence', value: `${stats.avgConfidence}%`, color: 'from-green-500 to-emerald-500', icon: '🎯' }
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

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
          </div>
          <button 
            onClick={() => setFilters({ search: '', severity: 'all', status: 'all', camera: 'all', dateRange: 'today' })}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search alerts..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Severity</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Camera
            </label>
            <select
              value={filters.camera}
              onChange={(e) => setFilters({ ...filters, camera: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Cameras</option>
              {cameras.map(cam => (
                <option key={cam} value={cam}>{cam}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Camera</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Action</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Severity</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Confidence</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert, index) => {
                    const severity = getSeverityColor(alert.severity)
                    const status = getStatusColor(alert.status)
                    const StatusIcon = status.icon
                    
                    return (
                      <motion.tr
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="text-sm font-mono text-gray-700 dark:text-gray-300">
                            {alert.timestamp}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {alert.camera}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Location: {alert.location.x}, {alert.location.y}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-gray-700 dark:text-gray-300">
                            {alert.action}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Duration: {alert.duration}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${severity.bg} ${severity.text} border ${severity.border}`}>
                            <span>{severity.icon}</span>
                            <span className="text-sm font-medium capitalize">{alert.severity}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${alert.confidence}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                                className={`h-full bg-gradient-to-r ${severity.color.split(' ').slice(1).join(' ')}`}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {alert.confidence}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${status.bg} ${status.text}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-sm font-medium capitalize">{alert.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="View Snapshot"
                            >
                              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </motion.button>
                            {alert.status === 'active' && (
                              <button className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                                Resolve
                              </button>
                            )}
                            {alert.status === 'pending' && (
                              <button className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                                Acknowledge
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Bell className="w-12 h-12 opacity-50" />
                        <p className="text-lg font-medium">No alerts found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            Previous
          </button>
          <button className="px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            1
          </button>
          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            2
          </button>
          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            3
          </button>
          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            Next
          </button>
        </div>
      </div>
    </motion.div>
  )
}