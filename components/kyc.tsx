'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Camera, RefreshCcw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function KycDemo() {
  const [step, setStep] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingComplete, setRecordingComplete] = useState(false)
  const [timer, setTimer] = useState(5)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [kycResult, setKycResult] = useState<{ fake_percentage: number, is_likely_deepfake: boolean } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      mediaRecorderRef.current = new MediaRecorder(stream)
      
      let chunks: BlobPart[] = []
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setVideoBlob(blob)
        setVideoUrl(URL.createObjectURL(blob))
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setTimer(5)

      const interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval)
            stopRecording()
            return 0
          }
          return prevTimer - 1
        })
      }, 1000)
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingComplete(true)
      const tracks = videoRef.current?.srcObject as MediaStream
      tracks?.getTracks().forEach(track => track.stop())
    }
  }, [])

  const resetRecording = useCallback(() => {
    setRecordingComplete(false)
    setVideoBlob(null)
    setVideoUrl(null)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoBlob) {
      console.error('No video recorded')
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('video', videoBlob, 'recorded_video.webm')

    try {
      const response = await fetch('https://dhairyashah-deepfake-alpha-version.hf.space/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const result = await response.json()
      setKycResult(result)

      if (result.is_likely_deepfake) {
        alert('KYC failed: Deepfake detected')
      } else {
        alert('KYC information submitted successfully!')
      }
    } catch (error) {
      console.error('Error submitting KYC information:', error)
      alert('Error submitting KYC information. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  const isPersonalDetailsComplete = firstName && lastName && email
  const isVideoComplete = recordingComplete

  const VideoRecorder = () => (
    <div className="space-y-4">
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        {videoUrl ? (
          <video src={videoUrl} controls className="w-full h-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        )}
      </div>
      {!recordingComplete && (
        <Button 
          type="button" 
          onClick={startRecording} 
          disabled={isRecording}
          className="w-full"
        >
          {isRecording ? `Recording: ${timer}s` : 'Start 5s Video Recording'}
          <Camera className="ml-2 h-4 w-4" />
        </Button>
      )}
      {recordingComplete && (
        <div className="flex justify-between">
          <div className="flex items-center text-green-500">
            <CheckCircle className="mr-2" />
            <span>Recording complete</span>
          </div>
          <Button 
            type="button" 
            onClick={resetRecording} 
            variant="outline"
          >
            Record Again
            <RefreshCcw className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )

  const steps = [
    {
      title: "Personal Details",
      description: "Please provide your personal information.",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
        </div>
      ),
      isComplete: isPersonalDetailsComplete
    },
    {
      title: "Video Verification",
      description: "Please record a 5-second video for verification.",
      content: <VideoRecorder />,
      isComplete: isVideoComplete
    },
    {
      title: "Confirmation",
      description: "Please review your information and submit.",
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Personal Details</h3>
            <p>Name: {firstName} {lastName}</p>
            <p>Email: {email}</p>
          </div>
          <div>
            <h3 className="font-semibold">Video Verification</h3>
            {videoUrl && (
              <video src={videoUrl} controls className="w-full aspect-video rounded-lg mt-2" />
            )}
          </div>
          {kycResult && (
            <Alert variant={kycResult.is_likely_deepfake ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{kycResult.is_likely_deepfake ? "Deepfake Detected" : "Video Analysis Result"}</AlertTitle>
              <AlertDescription>
                Fake Percentage: {kycResult.fake_percentage.toFixed(2)}%
                <br />
                {kycResult.is_likely_deepfake ? "KYC verification failed." : "KYC verification passed."}
              </AlertDescription>
            </Alert>
          )}
        </div>
      ),
      isComplete: isPersonalDetailsComplete && isVideoComplete
    }
  ]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>KYC Verification - Step {step + 1} of {steps.length}</CardTitle>
        <CardDescription>{steps[step].description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {steps[step].content}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          type="button" 
          onClick={() => setStep(prev => Math.max(0, prev - 1))}
          disabled={step === 0 || isSubmitting}
          variant="outline"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        {step < steps.length - 1 ? (
          <Button 
            type="button" 
            onClick={() => setStep(prev => Math.min(steps.length - 1, prev + 1))}
            disabled={!steps[step].isComplete || isSubmitting}
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={!steps[step].isComplete || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? 'Submitting...' : 'Submit KYC Information'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}