import { motion } from 'framer-motion'
import { X, Cpu, Shield, Zap, Globe, BarChart3, Users, Database, Bell, Camera, Cloud, Settings } from 'lucide-react'

export default function AboutPage({ onClose }) {
  const stats = [
    { label: 'Detection Accuracy', value: '94.2%', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Alerts Processed', value: '2,847', icon: <Bell className="w-5 h-5" /> },
    { label: 'Cameras Active', value: '8', icon: <Camera className="w-5 h-5" /> },
    { label: 'System Uptime', value: '99.8%', icon: <Shield className="w-5 h-5" /> },
  ]

  const technologies = [
    { category: 'Frontend', techs: ['React 18', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Recharts'] },
    { category: 'Backend', techs: ['Node.js', 'Express', 'Python', 'OpenCV', 'MediaPipe'] },
    { category: 'AI/ML', techs: ['TensorFlow', 'YOLOv8', 'Pose Estimation', 'Computer Vision'] },
    { category: 'Infrastructure', techs: ['Docker', 'AWS', 'PostgreSQL', 'Redis', 'WebSockets'] },
  ]

  const features = [
    {
      icon: <Cpu className="w-6 h-6" />,
      title: 'Real-time AI Detection',
      description: 'Advanced pose estimation and object detection algorithms processing at 30 FPS',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Multi-Channel Alerts',
      description: 'Simultaneous email, SMS, and push notifications with visual evidence',
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Cloud Architecture',
      description: 'Scalable distributed system with automatic failover and load balancing',
      color: 'from-emerald-500 to-green-500'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Role-based Access Control',
      description: 'Multi-tier permission system with audit logs and activity monitoring',
      color: 'from-purple-500 to-pink-500'
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700"
      >
        {/* Header */}
        <div className="relative p-8 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">WS</span>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-2 border-2 border-dashed border-primary-400/30 rounded-2xl"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  Waste Surveillance System
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full text-sm font-medium">
                    v2.4.1
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Enterprise Edition
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Introduction */}
          <div className="text-center">
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              An <span className="font-semibold text-primary-600 dark:text-primary-400">AI-powered surveillance platform</span> that 
              transforms urban monitoring through advanced computer vision, enabling cities to 
              detect and prevent illegal waste dumping with unprecedented accuracy and efficiency.
            </p>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div className="text-primary-500 dark:text-primary-400">
                    {stat.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Key Features */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Core Capabilities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 p-5 hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100 to-white dark:from-slate-800 dark:to-slate-900 opacity-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                      <div className="text-white">
                        {feature.icon}
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Technology Stack */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary-500" />
              Technology Stack
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {technologies.map((category, index) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-3"
                >
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">{category.category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.techs.map((tech, techIndex) => (
                      <motion.span
                        key={tech}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + techIndex * 0.05 }}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:scale-105 transition-transform duration-200"
                      >
                        {tech}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* System Architecture */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500" />
              System Architecture
            </h3>
            <div className="bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">Data Collection</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">RTSP cameras stream to edge processing units with hardware acceleration</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">AI Processing</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Multi-model inference pipeline with pose estimation and object detection</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">Action & Analytics</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Real-time alerts, data visualization, and automated reporting systems</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © 2024 Waste Surveillance Technologies. All rights reserved.
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                System Dashboard
              </button>
              <button className="px-5 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium">
                API Documentation
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}