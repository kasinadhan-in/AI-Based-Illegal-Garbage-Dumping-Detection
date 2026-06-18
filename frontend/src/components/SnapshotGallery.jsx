import React, { useEffect, useState } from 'react'
import { AlertTriangle, Download, ExternalLink, Image as ImageIcon, Clock, Maximize2 } from 'lucide-react'

const SNAP_BASE = 'http://localhost:5000'

export default function SnapshotGallery() {
  const [snapshots, setSnapshots] = useState([])
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    const es = new EventSource(`${SNAP_BASE}/api/stream-snapshots`)
    
    es.addEventListener('snapshots', (ev) => {
      try {
        const data = JSON.parse(ev.data)
        setSnapshots(data || [])
        setReloadKey(k => k + 1)
      } catch (error) {
        console.error('Error parsing snapshots:', error)
      } finally {
        setLoading(false)
      }
    })

    es.onerror = () => {
      setLoading(false)
      es.close()
    }

    return () => es.close()
  }, [])

  const handleDownload = (snapshot, e) => {
    e.preventDefault()
    const link = document.createElement('a')
    link.href = `${SNAP_BASE}${snapshot.url}?download=true`
    link.download = `${snapshot.name.replace(/\s+/g, '_')}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openLightbox = (snapshot, e) => {
    e.preventDefault()
    setSelectedImage(snapshot)
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  if (!snapshots.length) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
            No Detection Snapshots
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Snapshots will appear here when activity is detected
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Detection Snapshots
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
              {snapshots.length} captured
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {snapshots.map((s, index) => (
            <div 
              key={`${s.name}_${index}`} 
              className="group relative overflow-hidden rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-slate-900">
                <img 
                  src={`${SNAP_BASE}${s.url}?cb=${reloadKey}`} 
                  alt={s.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => handleDownload(s, e)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-xs font-medium transition-colors"
                        title="Download"
                      >
                        <Download className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={(e) => openLightbox(s, e)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-xs font-medium transition-colors"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="w-3 h-3" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Info Section */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                    {s.action || 'Detected Activity'}
                  </span>
                  {s.timestamp && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {s.timestamp.split(' ')[0]}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {s.name}
                </p>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-2">
                  <a 
                    href={`${SNAP_BASE}${s.url}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </a>
                  <button
                    onClick={(e) => handleDownload(s, e)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer Info */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {snapshots.length} detection snapshot{snapshots.length !== 1 ? 's' : ''} • Hover for actions
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span>Recent detections</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
            >
              ✕
            </button>
            
            <img
              src={`${SNAP_BASE}${selectedImage.url}`}
              alt={selectedImage.name}
              className="w-full h-full object-contain rounded-lg"
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{selectedImage.name}</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-2 py-1 bg-primary-500/20 rounded">
                      {selectedImage.action || 'Detection Snapshot'}
                    </span>
                    {selectedImage.timestamp && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {selectedImage.timestamp}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDownload(selectedImage, e)}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}