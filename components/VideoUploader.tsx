"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import io from 'socket.io-client'

export function VideoUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "uploading" | "analyzing" | "complete" | "error">("idle")
  const [fakePercentage, setFakePercentage] = useState<number | null>(null)
  const [isLikelyDeepfake, setIsLikelyDeepfake] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    socketRef.current = io('https://dhairyashah-deepfake-alpha-version.hf.space')

    socketRef.current.on('upload_progress', (data: { progress: number }) => {
      setUploadProgress(data.progress)
    })

    socketRef.current.on('analysis_progress', (data: { progress: number }) => {
      setAnalysisProgress(data.progress)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const handleFileChange = (selectedFile: File) => {
    if (selectedFile && selectedFile.type.startsWith("video/")) {
      setFile(selectedFile)
      setStatus("idle")
      setUploadProgress(0)
      setAnalysisProgress(0)
      setFakePercentage(null)
      setIsLikelyDeepfake(null)
      setErrorMessage(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setStatus("uploading")
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('video', file)

    try {
      const response = await fetch('https://dhairyashah-deepfake-alpha-version.hf.space/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setStatus("analyzing")
      setAnalysisProgress(0)

      const result = await response.json()
      
      setStatus("complete")
      setFakePercentage(result.fake_percentage)
      setIsLikelyDeepfake(result.is_likely_deepfake)
      setAnalysisProgress(100)
    } catch (error) {
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred")
    }
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    handleFileChange(droppedFile)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Video Uploader with Deepfake Detection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`flex items-center justify-center w-full ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
          } border-2 border-dashed rounded-lg cursor-pointer dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <label
            htmlFor="video-upload"
            className="flex flex-col items-center justify-center w-full h-64"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">MP4, WebM, or OGG (MAX. 800MB)</p>
            </div>
            <input
              ref={fileInputRef}
              id="video-upload"
              type="file"
              className="hidden"
              accept="video/*"
              onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
            />
          </label>
        </div>

        {file && (
          <>
            <p className="text-sm font-medium">Selected file: {file.name}</p>
            <video ref={videoRef} className="w-full rounded-lg" controls>
              <source src={URL.createObjectURL(file)} type={file.type} />
              Your browser does not support the video tag.
            </video>
            <Button onClick={handleUpload} disabled={status !== "idle"}>
              Upload and Analyze
            </Button>
          </>
        )}

        {status === "uploading" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Uploading...</p>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {status === "analyzing" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Analyzing...</p>
            <Progress value={analysisProgress} className="w-full" />
          </div>
        )}

        {status === "complete" && fakePercentage !== null && isLikelyDeepfake !== null && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {isLikelyDeepfake ? (
                <AlertCircle className="text-red-500" />
              ) : (
                <CheckCircle className="text-green-500" />
              )}
              <p className={`font-medium ${isLikelyDeepfake ? 'text-red-500' : 'text-green-500'}`}>
                {isLikelyDeepfake ? 'This video is likely a deepfake.' : 'This video is likely genuine.'}
              </p>
            </div>
            <p className="text-sm">Fake Percentage: {fakePercentage.toFixed(2)}%</p>
            <Progress value={fakePercentage} className="w-full" />
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center space-x-2 text-red-500">
            <AlertCircle />
            <p className="font-medium">Error: {errorMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}