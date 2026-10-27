import { useState, useRef, useEffect } from 'react'
import { Mic, Camera, Square, Download, AlertTriangle } from 'lucide-react'
import { showToast } from '@/components/ui/Toast'

interface EvidenceCaptureProps {
  onClose?: () => void
}

export default function EvidenceCapture({ onClose: _onClose }: EvidenceCaptureProps) {
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [audioTime, setAudioTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      recorder.ondataavailable = e => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlobs(prev => [...prev, blob])
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecordingAudio(true)
      setAudioTime(0)
      audioTimerRef.current = setInterval(() => setAudioTime(t => t + 1), 1000)
      showToast({ type: 'info', title: '🎤 Recording audio evidence...' })
    } catch (e) {
      showToast({ type: 'error', title: 'Cannot access microphone', message: String(e) })
    }
  }

  const stopAudioRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecordingAudio(false)
    if (audioTimerRef.current) clearInterval(audioTimerRef.current)
    showToast({ type: 'success', title: '✅ Audio recorded' })
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraActive(true)
    } catch (e) {
      showToast({ type: 'error', title: 'Cannot access camera', message: String(e) })
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx?.drawImage(videoRef.current, 0, 0)
    const url = canvasRef.current.toDataURL('image/jpeg', 0.8)
    setPhotoUrls(prev => [...prev, url])
    showToast({ type: 'success', title: '📸 Photo captured as evidence' })
  }

  const downloadEvidence = () => {
    audioBlobs.forEach((blob, i) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `evidence-audio-${Date.now()}-${i}.webm`
      a.click()
      URL.revokeObjectURL(url)
    })
    photoUrls.forEach((url, i) => {
      const a = document.createElement('a')
      a.href = url
      a.download = `evidence-photo-${Date.now()}-${i}.jpg`
      a.click()
    })
    showToast({ type: 'success', title: 'Evidence downloaded' })
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (audioTimerRef.current) clearInterval(audioTimerRef.current)
    }
  }, [])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 flex items-start gap-2">
        <AlertTriangle size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-orange-700 dark:text-orange-400">
          Evidence is stored locally on your device. In an emergency, SOS automatically starts recording.
        </p>
      </div>

      {/* Audio recording */}
      <div className="card p-4 space-y-3">
        <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <Mic size={16} className="text-red-500" /> Audio Recording
        </h4>
        {isRecordingAudio && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-600 font-mono">{formatTime(audioTime)}</span>
            <span className="text-xs text-slate-500">Recording...</span>
          </div>
        )}
        <button
          onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
            isRecordingAudio ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'btn-primary'
          }`}
        >
          {isRecordingAudio ? <><Square size={16} /> Stop Recording</> : <><Mic size={16} /> Start Recording</>}
        </button>
        {audioBlobs.length > 0 && (
          <p className="text-xs text-green-600 dark:text-green-400">{audioBlobs.length} audio clip(s) captured</p>
        )}
      </div>

      {/* Photo capture */}
      <div className="card p-4 space-y-3">
        <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <Camera size={16} className="text-blue-500" /> Photo Evidence
        </h4>
        {!cameraActive ? (
          <button onClick={startCamera} className="btn-secondary w-full py-3 flex items-center justify-center gap-2">
            <Camera size={16} /> Open Camera
          </button>
        ) : (
          <div className="space-y-2">
            <video ref={videoRef} className="w-full rounded-xl bg-black" playsInline muted />
            <button onClick={capturePhoto} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              <Camera size={16} /> Capture Photo
            </button>
          </div>
        )}
        {photoUrls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {photoUrls.map((url, i) => (
              <img key={i} src={url} alt={`Evidence ${i + 1}`} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
            ))}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {(audioBlobs.length > 0 || photoUrls.length > 0) && (
        <button
          onClick={downloadEvidence}
          className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
        >
          <Download size={16} /> Download All Evidence
        </button>
      )}
    </div>
  )
}
