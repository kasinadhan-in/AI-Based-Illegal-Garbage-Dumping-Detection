import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './ThemeContext'
import Header from './components/Header'
import StatsDashboard from './components/StatsDashboard'
import AdvancedCharts from './components/AdvancedCharts'
import AlertsManager from './components/AlertsManager'
import RealtimeStatus from './components/RealtimeStatus'
import VideoPlayer from './components/VideoPlayer'
import SnapshotGallery from './components/SnapshotGallery'
import DataViewer from './components/DataViewer'
import AboutPage from './components/AboutPage'
import UserProfile from './components/UserProfile'
import './index.css'

const API_BASE_URL = 'http://localhost:5000/api'

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [detections, setDetections] = useState([])
  const [stats, setStats] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAbout, setShowAbout] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'analytics', label: 'Advanced Analytics', icon: '📈' },
    { id: 'alerts', label: 'Alerts Manager', icon: '🚨' },
    { id: 'data', label: 'Data Viewer', icon: '📋' },
    { id: 'video', label: 'Video Analysis', icon: '🎥' },
    { id: 'snapshots', label: 'Snapshots', icon: '📸' }
  ]

  // Fetch real data from backend - FIXED VERSION
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch detections from CSV via backend
        const [detectionsRes, statsRes, snapshotsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/detections`),
          axios.get(`${API_BASE_URL}/stats`),
          axios.get(`${API_BASE_URL}/snapshots`)
        ]);
        
        const detectionsData = detectionsRes.data;
        const statsData = statsRes.data;
        const snapshotsData = snapshotsRes.data;
        
        // Debug log to check confidence values
        console.log('Debug - Sample confidence values from backend:', 
          detectionsData.slice(0, 3).map(d => ({
            raw: d.confidence,
            parsed: parseFloat(d.confidence),
            asPercentage: parseFloat(d.confidence) * 100,
            action: d.action
          }))
        );
        
        console.log('Debug - Stats from backend:', statsData);
        
        // Process detections to ensure proper confidence values
        const processedDetections = detectionsData.map(d => {
          let confidence = parseFloat(d.confidence) || 0.8;
          
          // Convert to decimal if it's a percentage
          if (confidence > 1) {
            confidence = confidence / 100;
          }
          
          // Cap between 0 and 1
          confidence = Math.min(1, Math.max(0, confidence));
          
          return {
            ...d,
            frame: parseInt(d.frame) || 0,
            time: parseFloat(d.time) || 0,
            action: d.action || 'Normal Action',
            confidence: parseFloat(confidence.toFixed(4)) // Store as decimal
          };
        });
        
        setDetections(processedDetections);
        setStats(statsData);
        setSnapshots(snapshotsData);
        setError(null);
        
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Backend server not running. Run: node server.js');
        // Load fallback data for development
        loadFallbackData();
      } finally {
        setLoading(false);
      }
    }

    const loadFallbackData = () => {
      // Create fallback data with proper decimal confidence values
      const sampleDetections = Array.from({ length: 100 }, (_, i) => {
        const isAlert = i % 10 === 0;
        const confidence = isAlert ? 0.85 + Math.random() * 0.15 : 0.70 + Math.random() * 0.20;
        return {
          frame: i + 1,
          time: (i * 0.5).toFixed(2),
          action: isAlert ? 'Dumping Detected' : 'Normal Action',
          confidence: parseFloat(confidence.toFixed(4)) // Decimal
        };
      });
      
      const sampleStats = {
        totalFrames: 2847,
        dumpingDetected: 245,
        normalActions: 2602,
        dumpingPercentage: 8.6,
        recentDumping: 5,
        avgConfidence: 87.5, // Percentage
        peakHour: '14:00-15:00',
        detectionRate: '94.2%',
        systemUptime: '99.8%'
      };
      
      const sampleSnapshots = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `Snapshot ${i + 1}`,
        url: `/snapshots/frame_${i + 1}.jpg`,
        timestamp: `00:${String(i * 15).padStart(2, '0')}`,
        action: i % 3 === 0 ? 'Dropping Garbage' : 'Person Detected',
        confidence: parseFloat((0.85 + Math.random() * 0.15).toFixed(4)) // Decimal
      }));
      
      setDetections(sampleDetections);
      setStats(sampleStats);
      setSnapshots(sampleSnapshots);
    }

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-4">
            Loading Dashboard...
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Connecting to surveillance system
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
      <Header 
        onAboutClick={() => setShowAbout(true)}
        onProfileClick={() => setShowProfile(true)}
      />
      
      <nav className="sticky top-20 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-1">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all rounded-lg ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {activeTab === 'dashboard' && (
              <>
                <div>
                  <motion.h2 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                  >
                    Waste Surveillance Dashboard
                  </motion.h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Real-time AI-powered monitoring system
                  </p>
                </div>
                <RealtimeStatus stats={stats} />
                <StatsDashboard stats={stats} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <VideoPlayer />
                  <SnapshotGallery snapshots={snapshots} />
                </div>
              </>
            )}
            
            {activeTab === 'analytics' && <AdvancedCharts detections={detections} />}
            {activeTab === 'alerts' && <AlertsManager detections={detections} />}
            {activeTab === 'data' && <DataViewer detections={detections} />}
            {activeTab === 'video' && <VideoPlayer />}
            {activeTab === 'snapshots' && <SnapshotGallery snapshots={snapshots} />}
          </motion.div>
        </AnimatePresence>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            <p className="text-sm text-red-500 dark:text-red-300 mt-1">
              To enable real data, run: <code className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">node server.js</code> in a separate terminal
            </p>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {showAbout && <AboutPage onClose={() => setShowAbout(false)} />}
        {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
      </AnimatePresence>

      <footer className="border-t border-gray-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">System</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">Dashboard</a></li>
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">Analytics</a></li>
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">Documentation</a></li>
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">Guides</a></li>
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">About</a></li>
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">Privacy</a></li>
                <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Status</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {error ? 'Backend Offline' : 'All Systems Operational'}
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2024 Waste Surveillance System. All rights reserved.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered waste monitoring and detection system
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}