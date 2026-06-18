import { motion, AnimatePresence } from 'framer-motion'
import ThemeSwitcher from './ThemeSwitcher'
import { useTheme } from '../ThemeContext'
import { Bell, Settings, HelpCircle, User, Activity, Shield, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Header({ onAboutClick, onProfileClick, onSettingsClick }) {
  const { theme } = useTheme()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const notifications = [
    { id: 1, title: 'New Alert Detected', message: 'Dumping activity at Loading Dock', time: '2 min ago', unread: true },
    { id: 2, title: 'System Update', message: 'AI model updated to v2.1', time: '1 hour ago', unread: false },
    { id: 3, title: 'Camera Status', message: 'Camera 3 reconnected', time: '3 hours ago', unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo */}
          <div className="flex items-center">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 mr-2"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <motion.button
                onClick={onAboutClick}
                whileHover={{ rotate: 10, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary-500 via-purple-600 to-pink-600 shadow-lg flex items-center justify-center group"
              >
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500/30 to-purple-600/30"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.button>

              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  WhoDumpedIt
                </h1>
                <p className="hidden md:block text-xs text-gray-500 dark:text-gray-400">
                  Mystery solved frame by frame.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Center Section - Status */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden md:flex items-center gap-4"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20 border border-emerald-200 dark:border-emerald-800/30">
              <motion.span
                className="w-2 h-2 bg-emerald-500 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <Activity className="w-3 h-3 inline mr-1" />
                System Active
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-200 dark:border-blue-800/30">
              <motion.span
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                <Shield className="w-3 h-3 inline mr-1" />
                24/7 Monitoring
              </span>
            </div>
          </motion.div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3">
            {/* Help Button */}
            <motion.button
              onClick={onAboutClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Help & About"
            >
              <HelpCircle className="w-5 h-5" />
            </motion.button>

            {/* Settings Button */}
            <motion.button
              onClick={onSettingsClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"
                  />
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{unreadCount} new alerts</p>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 ${
                            notification.unread ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {notification.title}
                                {notification.unread && (
                                  <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block animate-pulse"></span>
                                )}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {notification.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-3 border-t border-gray-200 dark:border-slate-700">
                      <button className="w-full text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-center py-2">
                        View All Notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Switcher */}
            <div className="hidden md:block">
              <ThemeSwitcher />
            </div>

            {/* Profile */}
            <motion.button
              onClick={onProfileClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg hover:shadow-xl transition-shadow"
              title="Profile"
            >
              <User className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-gray-200 dark:border-slate-800 mt-2"
            >
              <div className="py-4 space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                  <Activity className="w-4 h-4" />
                  <span>System Status</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                  <Shield className="w-4 h-4" />
                  <span>Security</span>
                </button>
                <button 
                  onClick={onAboutClick}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Help & About</span>
                </button>
                <div className="flex items-center justify-center px-4">
                  <ThemeSwitcher />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}