'use client'

import { useState, useRef } from "react"
import Image from 'next/image'
import { Upload, CheckCircle, AlertCircle, FileText, Download, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { generatePDFReport } from "./pdf-report"

interface TopFrame {
  frame_number: number
  prediction: string
  confidence: number
  visualization: string
}

export function VideoUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [predictionProgress, setPredictionProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "uploading" | "predicting" | "complete" | "error">("idle")
  const [fakePercentage, setFakePercentage] = useState<number | null>(null)
  const [isLikelyDeepfake, setIsLikelyDeepfake] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [topFrames, setTopFrames] = useState<TopFrame[]>([])
  const [report, setReport] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type.startsWith("video/")) {
      setFile(selectedFile)
      setStatus("idle")
      setUploadProgress(0)
      setPredictionProgress(0)
      setFakePercentage(null)
      setIsLikelyDeepfake(null)
      setErrorMessage(null)
      setTopFrames([])
      setReport(null)
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

      setStatus("predicting")
      setPredictionProgress(0)

      const result = await response.json()
      
      setStatus("complete")
      setFakePercentage(result.fake_percentage)
      setIsLikelyDeepfake(result.is_likely_deepfake)
      setTopFrames(result.top_frames)
      setPredictionProgress(100)

      // Generate report
      await generateReport(result.fake_percentage, result.is_likely_deepfake, result.top_frames)
    } catch (error) {
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred")
    }
  }

  const generateReport = async (fakePercentage: number, isLikelyDeepfake: boolean, topFrames: TopFrame[]) => {
    setIsGeneratingReport(true)
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fakePercentage, isLikelyDeepfake, topFrames }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setReport(data.report)
    } catch (error) {
      console.error('Error generating report:', error)
      setErrorMessage('Failed to generate report')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleDownloadReport = () => {
    if (!report) return

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'deepfake-analysis-report.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleGeneratePDF = () => {
    if (fakePercentage !== null && isLikelyDeepfake !== null && report && topFrames.length > 0) {
      generatePDFReport({
        fakePercentage,
        isLikelyDeepfake,
        report,
        topFrames,
      })
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Video Uploader with Deepfake Detection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="video-upload"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">MP4, WebM, or OGG (MAX. 800MB)</p>
            </div>
            <input
              id="video-upload"
              type="file"
              className="hidden"
              accept="video/*"
              onChange={handleFileChange}
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

        {status === "predicting" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Analyzing...</p>
            <Progress value={predictionProgress} className="w-full" />
          </div>
        )}

        {status === "complete" && fakePercentage !== null && isLikelyDeepfake !== null && (
          <div className="space-y-4">
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

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="report">
                <AccordionTrigger>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Detailed Report</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {isGeneratingReport ? (
                    <p>Generating report...</p>
                  ) : report ? (
                    <div className="prose max-w-none">
                      <p>{report}</p>
                      <Button onClick={handleGeneratePDF} className="w-full">
                        <FileDown className="w-4 h-4 mr-2" />
                        Generate PDF Report
                      </Button>
                    </div>
                  ) : (
                    <p>Failed to generate report.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Top Frames</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topFrames.map((frame, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-4">
                      <Image
                        src={`data:image/png;base64,${frame.visualization}`}
                        alt={`Frame ${frame.frame_number}`}
                        width={300}
                        height={300}
                        className="w-full h-auto rounded-lg"
                      />
                      <div className="mt-2">
                        <p className="text-sm font-medium">Frame: {frame.frame_number}</p>
                        <p className="text-sm">Prediction: {frame.prediction}</p>
                        <p className="text-sm">Confidence: {(frame.confidence * 100).toFixed(2)}%</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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