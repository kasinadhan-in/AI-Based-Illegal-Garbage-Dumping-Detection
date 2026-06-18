import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipForward, SkipBack, AlertCircle, Maximize2, Minimize2, RefreshCw, Volume2, VolumeX } from 'lucide-react'

const SNAP_BASE = 'http://localhost:5000'

export default function VideoPlayer() {
  const [snapshots, setSnapshots] = useState([])
  const [detections, setDetections] = useState([])
  const [playing, setPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(100)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [loading, setLoading] = useState(true)
  const [currentAlert, setCurrentAlert] = useState(null)
  const [showControls, setShowControls] = useState(true)

  const indexRef = useRef(0)
  const playerRef = useRef(null)
  const containerRef = useRef(null)
  const [, forceUpdate] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const controlsTimeout = useRef(null)

  // Subscribe to SSE snapshot events
  useEffect(() => {
    const es = new EventSource(`${SNAP_BASE}/api/stream-snapshots`)
    es.addEventListener('snapshots', (ev) => {
      try {
        const data = JSON.parse(ev.data)
        setSnapshots(data || [])
        setDuration(data.length * 10) // 10 seconds per frame
        setReloadKey(k => k + 1)
        setLoading(false)
      } catch (e) {}
    })
    es.onerror = () => {
      setLoading(false)
      es.close()
    }
    return () => es.close()
  }, [])

  // Fetch detection data
  useEffect(() => {
    const fetchDetections = async () => {
      try {
        const response = await fetch(`${SNAP_BASE}/api/detections`)
        const data = await response.json()
        setDetections(data)
      } catch (error) {
        console.error('Error fetching detections:', error)
      }
    }
    fetchDetections()
  }, [])

  // Advance frames with playback speed control
  useEffect(() => {
    if (!playing || snapshots.length === 0) return
    
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % snapshots.length
      setCurrentTime(indexRef.current * 10)
      forceUpdate(n => n + 1)
      
      // Check for alerts at current frame
      const currentFrame = indexRef.current + 1
      const currentDetection = detections.find(d => d.frame === currentFrame)
      if (currentDetection && currentDetection.action === 'Dumping Detected') {
        setCurrentAlert({
          type: 'Dumping Detected',
          confidence: currentDetection.confidence * 100,
          timestamp: currentDetection.time
        })
      } else {
        setCurrentAlert(null)
      }
    }, 600 / playbackSpeed)
    
    return () => clearInterval(interval)
  }, [playing, snapshots, playbackSpeed, detections])

  // Handle controls visibility
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      controlsTimeout.current = setTimeout(() => {
        if (playing) setShowControls(false)
      }, 3000)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      return () => {
        container.removeEventListener('mousemove', handleMouseMove)
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      }
    }
  }, [playing])

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case ' ':
          e.preventDefault()
          setPlaying(p => !p)
          break
        case 'ArrowRight':
          e.preventDefault()
          indexRef.current = Math.min(indexRef.current + 1, snapshots.length - 1)
          forceUpdate(n => n + 1)
          break
        case 'ArrowLeft':
          e.preventDefault()
          indexRef.current = Math.max(indexRef.current - 1, 0)
          forceUpdate(n => n + 1)
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          setIsMuted(m => !m)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [snapshots.length])

  const current = snapshots.length ? snapshots[indexRef.current % snapshots.length] : null
  const src = current ? `${SNAP_BASE}${current.url}?cb=${reloadKey}` : ''
  
  const handleSeek = (e) => {
    const newTime = parseInt(e.target.value)
    setCurrentTime(newTime)
    indexRef.current = Math.floor(newTime / 10)
    forceUpdate(n => n + 1)
  }

  const handleSkip = (seconds) => {
    indexRef.current = Math.max(0, Math.min(snapshots.length - 1, indexRef.current + seconds))
    setCurrentTime(indexRef.current * 10)
    forceUpdate(n => n + 1)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleReload = () => {
    setLoading(true)
    setReloadKey(k => k + 1)
    setTimeout(() => setLoading(false), 500)
  }

  if (loading) {
    return (
      <div className="card h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading video feed...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
      ref={containerRef}
    >
      <div className="card overflow-hidden p-0 bg-black/5 dark:bg-black/20">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Real-time Video Analysis
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">LIVE</span>
                </div>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Frame {indexRef.current + 1} of {snapshots.length} • {formatTime(currentTime)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReload}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Refresh feed"
              >
                <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Toggle fullscreen"
              >
                {isFullscreen ? 
                  <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : 
                  <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="relative aspect-video bg-black">
          {/* Current Frame */}
          {src ? (
            <img
              src={src}
              alt="Live analysis snapshot"
              className="w-full h-full object-contain"
              ref={playerRef}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="w-16 h-16 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📹</span>
                </div>
                <p className="text-lg font-medium">No video feed available</p>
                <p className="text-sm mt-1">Waiting for camera connection...</p>
              </div>
            </div>
          )}

          {/* Current Alert Overlay */}
          <AnimatePresence>
            {currentAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-4 left-4 bg-gradient-to-r from-rose-600 to-red-600 text-white px-4 py-2 rounded-xl shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <p className="font-bold">ALERT: {currentAlert.type}</p>
                    <p className="text-xs opacity-90">
                      Confidence: {currentAlert.confidence.toFixed(1)}% • Time: {currentAlert.timestamp}s
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Snapshot Info */}
          {current && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm"
            >
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span>Snapshot: {current.name}</span>
                </div>
                <div className="text-xs text-gray-300 mt-1">{current.timestamp}</div>
              </div>
            </motion.div>
          )}

          {/* Controls Overlay */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
              >
                {/* Progress Bar */}
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-300 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Playback Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSkip(-30)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Skip back 30s"
                      >
                        <SkipBack className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => setPlaying(p => !p)}
                        className="p-3 bg-white text-black rounded-full hover:scale-105 transition-transform"
                        title={playing ? 'Pause' : 'Play'}
                      >
                        {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleSkip(30)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Skip forward 30s"
                      >
                        <SkipForward className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsMuted(m => !m)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {isMuted ? 
                          <VolumeX className="w-5 h-5 text-white" /> : 
                          <Volume2 className="w-5 h-5 text-white" />
                        }
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        className="w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Playback Speed */}
                  <div className="flex items-center gap-2">
                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                      className="bg-black/50 text-white border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <option value="0.25">0.25x</option>
                      <option value="0.5">0.5x</option>
                      <option value="0.75">0.75x</option>
                      <option value="1">Normal</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2x</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Play/Pause Overlay */}
          {!showControls && playing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-4 bg-black/50 rounded-full backdrop-blur-sm">
                <Play className="w-8 h-8 text-white/50" />
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Connected: {snapshots.length} snapshots
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${playing ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {playing ? 'Playing' : 'Paused'}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-mono">Frame {indexRef.current + 1}/{snapshots.length}</span>
              <span className="mx-2">•</span>
              <span>{playbackSpeed}x speed</span>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Space</kbd>
              <span>Play/Pause</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">← →</kbd>
              <span>Seek</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">F</kbd>
              <span>Fullscreen</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">M</kbd>
              <span>Mute</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}