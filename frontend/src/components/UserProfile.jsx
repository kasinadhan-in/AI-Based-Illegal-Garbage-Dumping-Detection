import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Settings, LogOut, Shield, Bell, Activity, Mail, Lock, Globe, Moon, Sun, CreditCard, Database, Camera } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../ThemeContext'

export default function UserProfile({ onClose }) {
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(theme === 'dark')

  const user = {
    name: 'Admin User',
    email: 'admin@wastesurveillance.com',
    role: 'System Administrator',
    avatar: 'AU',
    lastLogin: '2 hours ago',
    joinDate: 'Jan 15, 2024',
    notifications: 3,
    permissions: ['Full System Access', 'Manage Alerts', 'View Analytics', 'Export Data', 'User Management', 'System Settings'],
    subscription: 'Enterprise Plan',
    subscriptionStatus: 'Active',
    cameras: 8,
    storage: '85%',
    apiCalls: '1,243'
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ]

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      console.log('Signing out...')
      onClose()
    }
  }

  const handleThemeToggle = () => {
    setDarkMode(!darkMode)
    toggleTheme()
  }

  return (
    <AnimatePresence>
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
          className="bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 p-6 border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-white">{user.avatar}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-2 border-2 border-dashed border-primary-400/30 rounded-2xl"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.role}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Profile Tab */}
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                      </label>
                      <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-xl text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                      </label>
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-900 dark:text-white">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* User Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Cameras</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {user.cameras}
                          </p>
                        </div>
                        <Camera className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-600/10 dark:from-purple-500/20 dark:to-pink-600/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Storage</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {user.storage}
                          </p>
                        </div>
                        <Database className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Permissions & Access
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {user.permissions.map((permission, index) => (
                        <motion.div
                          key={permission}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="px-3 py-2 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-gray-700 dark:text-gray-300">{permission}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-600/10 dark:from-emerald-500/20 dark:to-green-600/20 border border-emerald-200 dark:border-emerald-800/30">
                      <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Account Security</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Last password change: 15 days ago
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-gray-500" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Update your account password
                            </p>
                          </div>
                        </div>
                        <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">
                          Update
                        </span>
                      </button>

                      <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-gray-500" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">Login History</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              View recent login activity
                            </p>
                          </div>
                        </div>
                        <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">
                          View
                        </span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-600/10 dark:from-blue-500/20 dark:to-cyan-600/20 border border-blue-200 dark:border-blue-800/30">
                    <div className="flex items-center gap-3">
                      <Bell className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Notifications</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {user.notifications} unread alerts
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notificationsEnabled
                            ? 'bg-blue-500'
                            : 'bg-gray-300 dark:bg-slate-700'
                        }`}
                      >
                        <motion.div
                          animate={{ x: notificationsEnabled ? 24 : 4 }}
                          className="w-4 h-4 bg-white rounded-full absolute top-1"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300">Email Alerts</span>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300">Push Notifications</span>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300">SMS Alerts</span>
                      <div className="w-3 h-3 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-600/10 dark:from-purple-500/20 dark:to-pink-600/20 border border-purple-200 dark:border-purple-800/30">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{user.subscription}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                            {user.subscriptionStatus}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            API Calls: {user.apiCalls}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900">
                          {darkMode ? <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" /> : <Sun className="w-5 h-5 text-amber-500" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Switch between light and dark mode
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleThemeToggle}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          darkMode
                            ? 'bg-purple-500'
                            : 'bg-gray-300'
                        }`}
                      >
                        <motion.div
                          animate={{ x: darkMode ? 24 : 4 }}
                          className="w-4 h-4 bg-white rounded-full absolute top-1"
                        />
                      </button>
                    </div>

                    <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900">
                          <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Language & Region</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            English (US) • UTC-05:00
                          </p>
                        </div>
                      </div>
                      <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">
                        Change
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Actions */}
            <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => console.log('Edit Profile')}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <User className="w-4 h-4" />
                  Edit Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3" />
                <span>Last login: {user.lastLogin}</span>
              </div>
              <span>Member since {user.joinDate}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}