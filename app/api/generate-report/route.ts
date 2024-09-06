import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { fakePercentage, isLikelyDeepfake, topFrames } = await request.json()
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI expert specializing in deepfake detection. Provide a detailed analysis of the video based on the given data."
        },
        {
          role: "user",
          content: `Analyze this deepfake detection result:
Fake Percentage: ${fakePercentage}%
Is Likely Deepfake: ${isLikelyDeepfake}
Top Frames:
${topFrames.map((frame: any) =>
  `Frame ${frame.frame_number}: Prediction - ${frame.prediction}, Confidence - ${(frame.confidence * 100).toFixed(2)}%`
).join('\n')}
Provide a detailed report on the likelihood of the video being a deepfake, potential implications, and any patterns or anomalies in the top frames.`
        }
      ],
    })
    const report = completion.choices[0].message?.content
    return NextResponse.json({ report })
  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    return NextResponse.json({ error: 'Error generating report' }, { status: 500 })
  }
}