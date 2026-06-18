import { motion } from 'framer-motion'
import { BarChart3, Activity, Shield, AlertTriangle, CheckCircle, Target } from 'lucide-react'

export default function StatsDashboard({ stats }) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15
      },
    },
  }

  // Calculate statistics with proper formatting
  const dumpingPercentage = Math.min(parseFloat(stats.dumpingPercentage) || 0, 100);
  const avgConfidence = parseFloat(stats.avgConfidence) || 0;
  const displayConfidence = avgConfidence > 1 ? avgConfidence : avgConfidence * 100;
  const recentDumping = stats.recentDumping || 0;
  const detectionRate = stats.detectionRate ? parseFloat(stats.detectionRate) : 94.2;
  const systemUptime = stats.systemUptime ? parseFloat(stats.systemUptime) : 99.8;

  // Get color based on value ranges
  const getPercentageColor = (value) => {
    if (value >= 90) return 'text-emerald-500 dark:text-emerald-400';
    if (value >= 80) return 'text-sky-500 dark:text-sky-400';
    if (value >= 70) return 'text-amber-500 dark:text-amber-400';
    return 'text-rose-500 dark:text-rose-400';
  }

  const getProgressColor = (value) => {
    if (value >= 90) return 'from-emerald-500 to-green-500';
    if (value >= 80) return 'from-sky-500 to-cyan-500';
    if (value >= 70) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-500';
  }

  const getIcon = (index) => {
    const icons = [
      <BarChart3 className="w-6 h-6" />,
      <AlertTriangle className="w-6 h-6" />,
      <CheckCircle className="w-6 h-6" />,
      <Activity className="w-6 h-6" />,
      <Target className="w-6 h-6" />,
      <Shield className="w-6 h-6" />
    ];
    return icons[index % icons.length];
  }

  const getGradient = (index) => {
    const gradients = [
      'from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20',
      'from-rose-500/10 to-red-600/10 dark:from-rose-500/20 dark:to-red-600/20',
      'from-emerald-500/10 to-green-600/10 dark:from-emerald-500/20 dark:to-green-600/20',
      'from-purple-500/10 to-violet-600/10 dark:from-purple-500/20 dark:to-violet-600/20',
      'from-amber-500/10 to-orange-600/10 dark:from-amber-500/20 dark:to-orange-600/20',
      'from-sky-500/10 to-cyan-600/10 dark:from-sky-500/20 dark:to-cyan-600/20'
    ];
    return gradients[index % gradients.length];
  }

  const statCards = [
    {
      title: 'Total Frames',
      value: stats.totalFrames?.toLocaleString() || '0',
      description: 'Processed video frames',
      icon: getIcon(0),
      gradient: getGradient(0),
      change: '+12.5%'
    },
    {
      title: 'Dumping Detected',
      value: stats.dumpingDetected?.toLocaleString() || '0',
      description: 'Alert events triggered',
      icon: getIcon(1),
      gradient: getGradient(1),
      change: `${dumpingPercentage.toFixed(1)}% of total`
    },
    {
      title: 'Normal Actions',
      value: stats.normalActions?.toLocaleString() || '0',
      description: 'Non-alert activities',
      icon: getIcon(2),
      gradient: getGradient(2),
      change: 'Compliant behavior'
    },
    {
      title: 'Dumping Percentage',
      value: `${dumpingPercentage.toFixed(1)}%`,
      description: 'Alert frequency',
      icon: getIcon(3),
      gradient: getGradient(3),
      change: `${recentDumping} recent alerts`,
      progress: dumpingPercentage,
      showProgress: true
    },
    {
      title: 'Avg Confidence',
      value: `${Math.min(displayConfidence, 100).toFixed(1)}%`,
      description: 'Detection accuracy',
      icon: getIcon(4),
      gradient: getGradient(4),
      change: 'Model performance',
      progress: Math.min(displayConfidence, 100),
      showProgress: true
    },
    {
      title: 'System Uptime',
      value: `${systemUptime.toFixed(1)}%`,
      description: 'Operational reliability',
      icon: getIcon(5),
      gradient: getGradient(5),
      change: 'Last 30 days',
      progress: systemUptime,
      showProgress: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Overview</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time monitoring statistics updated every 30 seconds
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Optimal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            whileHover={{ 
              scale: 1.02, 
              y: -5,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br ${stat.gradient} p-6 hover:shadow-xl transition-all duration-300 group`}
          >
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/20 to-transparent dark:from-black/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient.replace('/10', '/20').replace('/20', '/30')} backdrop-blur-sm`}>
                  <div className="text-gray-700 dark:text-gray-300">
                    {stat.icon}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  stat.progress >= 90 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                  stat.progress >= 80 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                }`}>
                  {stat.change}
                </span>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  {stat.title}
                </p>
                <h3 className={`text-3xl font-bold ${getPercentageColor(stat.progress || 0)}`}>
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.description}
                </p>
              </div>

              {/* Progress Bar (for percentage stats) */}
              {stat.showProgress && (
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{stat.progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.progress}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(stat.progress)}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary-500/20 rounded-2xl transition-all duration-300" />
          </motion.div>
        ))}
      </motion.div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detection Performance */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Detection Performance</h4>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPercentageColor(detectionRate)}`}>
              {detectionRate.toFixed(1)}%
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Accuracy Rate</span>
              <span className="font-medium text-gray-900 dark:text-white">{detectionRate.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${detectionRate}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h4>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Live</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Last 5 minutes</span>
              <span className="font-medium text-rose-600 dark:text-rose-400">{recentDumping} alerts</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Peak hour</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.peakHour || '14:00-15:00'}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Excellent (≥90%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Good (80-89%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Fair (70-79%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-500 to-red-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Needs attention (&lt;70%)</span>
        </div>
      </div>
    </div>
  )
}