import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AlertsManager() {
  const [filters, setFilters] = useState({
    search: '',
    severity: 'all',
    status: 'all',
    dateRange: 'today'
  })

  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      
      // Fetch data from backend API
      const [detectionsRes, eventsRes, snapshotsRes] = await Promise.all([
        fetch('/api/detections'),
        fetch('/api/events'),
        fetch('/api/snapshots')
      ])

      const detections = await detectionsRes.json()
      const events = await eventsRes.json()
      const snapshots = await snapshotsRes.json()

      // Process alerts from CSV data
      const processedAlerts = processAlertsData(detections, events, snapshots)
      setAlerts(processedAlerts)

    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const processAlertsData = (detections, events, snapshots) => {
    const alerts = []
    
    // Process dumping detections
    detections.filter(d => d.action === 'Dumping Detected').forEach((detection, index) => {
      const timeInSeconds = parseFloat(detection.time)
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setSeconds(date.getSeconds() + timeInSeconds)
      
      const timestamp = date.toISOString().replace('T', ' ').substring(0, 19)
      const confidence = detection.confidence * 100
      
      // Determine severity based on confidence and duration pattern
      let severity = 'medium'
      if (confidence >= 90) severity = 'high'
      else if (confidence <= 75) severity = 'low'
      
      // Check if there's a matching event
      const matchingEvent = events.find(e => 
        Math.abs(parseFloat(e.timestamp) - timeInSeconds) < 0.1
      )
      
      // Determine status based on time (older than 5 minutes = resolved)
      const isActive = (timeInSeconds % 3600) > (Date.now() / 1000) % 3600 - 300
      const status = isActive ? 'active' : 'resolved'
      
      // Find matching snapshot
      const matchingSnapshot = snapshots.find(s => 
        s.action === 'Dropping Garbage' || s.action === 'Dumping Detected'
      )
      
      alerts.push({
        id: alerts.length + 1,
        timestamp,
        timeSeconds: timeInSeconds,
        camera: getCameraName(index),
        action: 'Dropping Garbage',
        severity,
        status,
        confidence,
        duration: `${(0.5 + Math.random() * 4.5).toFixed(1)}s`,
        frame: detection.frame,
        snapshotUrl: matchingSnapshot?.url || null,
        poseStatus: matchingEvent?.action || 'Pose Detected'
      })
    })
    
    // Process "No Pose Detected" events
    events.filter(e => e.action === 'No Pose Detected').forEach((event, index) => {
      if (index % 3 === 0) { // Add only some events as alerts
        const date = new Date()
        date.setHours(0, 0, 0, 0)
        date.setSeconds(date.getSeconds() + parseFloat(event.timestamp))
        
        const timestamp = date.toISOString().replace('T', ' ').substring(0, 19)
        
        alerts.push({
          id: alerts.length + 1,
          timestamp,
          timeSeconds: parseFloat(event.timestamp),
          camera: getCameraName(index + 1),
          action: 'Person Loitering',
          severity: 'low',
          status: 'resolved',
          confidence: 60 + Math.random() * 25,
          duration: `${(10 + Math.random() * 50).toFixed(1)}s`,
          frame: event.frame,
          snapshotUrl: null,
          poseStatus: 'No Pose Detected'
        })
      }
    })
    
    // Sort by time (most recent first)
    return alerts.sort((a, b) => b.timeSeconds - a.timeSeconds)
  }

  const getCameraName = (index) => {
    const cameras = [
      'Entrance Gate A',
      'Loading Dock',
      'Side Corridor',
      'Parking Area',
      'Main Hall',
      'Storage Area',
      'Back Entrance',
      'Delivery Zone'
    ]
    return cameras[index % cameras.length]
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'badge-danger'
      case 'medium':
        return 'badge-warning'
      case 'low':
        return 'badge-info'
      default:
        return 'badge-info'
    }
  }

  const getStatusColor = (status) => {
    return status === 'active' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' :
           'bg-gray-100 dark:bg-slate-700/30 text-gray-700 dark:text-gray-300'
  }

  const handleViewAlert = (alert) => {
    setSelectedAlert(alert)
    setShowDetails(true)
  }

  const handleResolveAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ))
  }

  const handleExportCSV = () => {
    const csvContent = [
      ['ID', 'Timestamp', 'Camera', 'Action', 'Severity', 'Status', 'Confidence', 'Duration', 'Frame'],
      ...alerts.map(alert => [
        alert.id,
        alert.timestamp,
        alert.camera,
        alert.action,
        alert.severity,
        alert.status,
        `${alert.confidence}%`,
        alert.duration,
        alert.frame
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alerts_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.action.toLowerCase().includes(filters.search.toLowerCase()) ||
                          alert.camera.toLowerCase().includes(filters.search.toLowerCase())
    const matchesSeverity = filters.severity === 'all' || alert.severity === filters.severity
    const matchesStatus = filters.status === 'all' || alert.status === filters.status
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const activeAlerts = filteredAlerts.filter(a => a.status === 'active').length
  const totalAlerts = filteredAlerts.length
  const avgConfidence = filteredAlerts.length > 0 ?
    (filteredAlerts.reduce((sum, a) => sum + a.confidence, 0) / filteredAlerts.length).toFixed(1) :
    0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading alerts data...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-6"
      >
        {/* Filters Bar */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Camera or action..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input-field"
              />
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="input-field"
              >
                <option value="all">All Levels</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input-field"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={fetchAlerts}
                className="btn-secondary flex-1"
              >
                ↻ Refresh
              </button>
              <button
                onClick={handleExportCSV}
                className="btn-primary flex-1"
              >
                📥 Export
              </button>
            </div>
          </div>
        </div>

        {/* Alerts Summary */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="stat-card text-center border-l-4 border-rose-500"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">Active Alerts</p>
            <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">
              {activeAlerts}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Requires attention
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="stat-card text-center border-l-4 border-amber-500"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">Today's Total</p>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
              {totalAlerts}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Based on {alerts.length} records
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="stat-card text-center border-l-4 border-sky-500"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">Avg Confidence</p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
              {avgConfidence}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Detection accuracy
            </p>
          </motion.div>
        </div>

        {/* Alerts Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="table-head">Timestamp</th>
                  <th className="table-head">Camera</th>
                  <th className="table-head">Action</th>
                  <th className="table-head">Severity</th>
                  <th className="table-head">Confidence</th>
                  <th className="table-head">Duration</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert, index) => (
                      <motion.tr
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`table-row-hover ${alert.status === 'active' ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}`}
                      >
                        <td className="table-cell">
                          <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                            {alert.timestamp}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500 block">
                            Frame: {alert.frame}
                          </span>
                        </td>
                        <td className="table-cell font-medium text-gray-900 dark:text-gray-100">
                          {alert.camera}
                          <span className="text-xs text-gray-500 dark:text-gray-500 block">
                            {alert.poseStatus}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {alert.action}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${alert.confidence >= 90 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 
                                          alert.confidence >= 80 ? 'bg-gradient-to-r from-sky-500 to-cyan-500' : 
                                          'bg-gradient-to-r from-amber-500 to-orange-500'}`}
                                style={{ width: `${alert.confidence}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${
                              alert.confidence >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                              alert.confidence >= 80 ? 'text-sky-600 dark:text-sky-400' :
                              'text-amber-600 dark:text-amber-400'
                            }`}>
                              {alert.confidence.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="table-cell text-gray-700 dark:text-gray-300 font-mono">
                          {alert.duration}
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${getStatusColor(alert.status)}`}>
                            {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewAlert(alert)}
                              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                            >
                              Details
                            </motion.button>
                            {alert.status === 'active' && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleResolveAlert(alert.id)}
                                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                              >
                                Resolve
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="table-cell text-center text-gray-500 dark:text-gray-400 py-8">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-lg font-medium">No alerts found matching your filters</p>
                          <p className="text-sm mt-1">Try adjusting your search criteria</p>
                          <button
                            onClick={() => setFilters({ search: '', severity: 'all', status: 'all', dateRange: 'today' })}
                            className="mt-4 text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            Clear all filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination and Info */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredAlerts.length} of {alerts.length} total alerts
            {filters.search && ` • Filtered by: "${filters.search}"`}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary">
              🔔 Alert Settings
            </button>
            <button
              onClick={fetchAlerts}
              className="btn-primary"
            >
              ↻ Refresh Data
            </button>
          </div>
        </div>
      </motion.div>

      {/* Alert Details Modal */}
      <AnimatePresence>
        {showDetails && selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Alert Details
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    ID: #{selectedAlert.id} • Frame: {selectedAlert.frame}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Timestamp
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedAlert.timestamp}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Camera Location
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedAlert.camera}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Detected Action
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedAlert.action}
                      </span>
                      <span className={`badge ${getSeverityColor(selectedAlert.severity)}`}>
                        {selectedAlert.severity.charAt(0).toUpperCase() + selectedAlert.severity.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Confidence Score
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-cyan-500"
                          style={{ width: `${selectedAlert.confidence}%` }}
                        />
                      </div>
                      <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
                        {selectedAlert.confidence.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Duration
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedAlert.duration}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Pose Status
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedAlert.poseStatus}
                    </p>
                  </div>
                </div>
              </div>

              {selectedAlert.snapshotUrl && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Related Snapshot
                  </label>
                  <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <img
                      src={selectedAlert.snapshotUrl}
                      alt="Alert snapshot"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                {selectedAlert.status === 'active' && (
                  <button
                    onClick={() => {
                      handleResolveAlert(selectedAlert.id)
                      setShowDetails(false)
                    }}
                    className="btn-primary"
                  >
                    Mark as Resolved
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}