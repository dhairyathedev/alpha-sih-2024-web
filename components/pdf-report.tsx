import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, pdf, Font } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'

// Register custom fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
})

interface TopFrame {
  frame_number: number
  prediction: string
  confidence: number
  visualization: string
}

interface PDFReportProps {
  fakePercentage: number
  isLikelyDeepfake: boolean
  report: string
  topFrames: TopFrame[]
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Roboto',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #3b82f6',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1e40af',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 5,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1e40af',
    marginBottom: 15,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 5,
  },
  text: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#374151',
  },
  result: {
    fontSize: 16,
    fontWeight: 500,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultFake: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  resultGenuine: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  percentageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  percentageCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: 700,
    color: '#ffffff',
  },
  percentageLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 10,
  },
  frameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  frameItem: {
    width: '48%',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    border: '1 solid #e5e7eb',
  },
  frameImage: {
    width: '100%',
    height: 150,
    objectFit: 'cover',
  },
  frameInfo: {
    padding: 10,
    backgroundColor: '#f9fafb',
  },
  frameInfoText: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 2,
  },
})

const PDFReport: React.FC<PDFReportProps> = ({ 
  fakePercentage, 
  isLikelyDeepfake, 
  report, 
  topFrames
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Deepfake Analysis Report</Text>
        <Text style={styles.subtitle}>Generated on {new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analysis Results</Text>
        <View style={[styles.result, isLikelyDeepfake ? styles.resultFake : styles.resultGenuine]}>
          <Text>{isLikelyDeepfake ? 'This video is likely a deepfake.' : 'This video is likely genuine.'}</Text>
        </View>
        <View style={styles.percentageContainer}>
          <View style={styles.percentageCircle}>
            <Text style={styles.percentageText}>{fakePercentage.toFixed(2)}%</Text>
          </View>
          <Text style={styles.percentageLabel}>Fake Percentage</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detailed Analysis</Text>
        <Text style={styles.text}>{report}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Analyzed Frames</Text>
        <View style={styles.frameGrid}>
          {topFrames.map((frame, index) => (
            <View key={index} style={styles.frameItem}>
              <Image
                style={styles.frameImage}
                src={`data:image/png;base64,${frame.visualization}`}
              />
              <View style={styles.frameInfo}>
                <Text style={styles.frameInfoText}>Frame: {frame.frame_number}</Text>
                <Text style={styles.frameInfoText}>Prediction: {frame.prediction}</Text>
                <Text style={styles.frameInfoText}>Confidence: {(frame.confidence * 100).toFixed(2)}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Page>
  </Document>
)

export const generatePDFReport = async (props: PDFReportProps) => {
  const blob = await pdf(<PDFReport {...props} />).toBlob()
  saveAs(blob, 'deepfake-analysis-report.pdf')
}