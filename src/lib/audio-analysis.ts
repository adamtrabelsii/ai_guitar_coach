import { PitchDetector } from "pitchy"
import type { AudioMetrics } from "@/types"

export async function analyzeAudio(blob: Blob): Promise<AudioMetrics> {
  const arrayBuffer = await blob.arrayBuffer()
  const audioCtx = new AudioContext()
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  await audioCtx.close()

  const duration = audioBuffer.duration
  const sampleRate = audioBuffer.sampleRate
  const channelData = audioBuffer.getChannelData(0)

  // ── Pitch detection via Pitchy ──────────────────────────────
  const frameSize = 2048
  const hopSize = 512
  const detector = PitchDetector.forFloat32Array(frameSize)
  const frame = new Float32Array(frameSize)

  const detectedPitches: number[] = []

  for (let i = 0; i + frameSize < channelData.length; i += hopSize) {
    frame.set(channelData.subarray(i, i + frameSize))
    const [pitch, clarity] = detector.findPitch(frame, sampleRate)
    // Only accept confident, guitar-range pitches (E2=82Hz to E6=1319Hz)
    if (clarity > 0.9 && pitch > 80 && pitch < 1400) {
      detectedPitches.push(pitch)
    }
  }

  const averagePitch =
    detectedPitches.length > 0
      ? detectedPitches.reduce((a, b) => a + b, 0) / detectedPitches.length
      : 0

  // Pitch stability: how consistent detected pitches are (lower variance = higher score)
  let pitchStability = 0
  if (detectedPitches.length > 1) {
    const mean = averagePitch
    const variance =
      detectedPitches.reduce((acc, p) => acc + (p - mean) ** 2, 0) /
      detectedPitches.length
    const stdDev = Math.sqrt(variance)
    // Map stdDev to 0–100: stdDev of 0 = 100, stdDev of 100+ Hz = 0
    pitchStability = Math.round(Math.max(0, 100 - stdDev * 1.2))
  }

  // ── BPM via onset detection ─────────────────────────────────
  // Track amplitude spikes (onsets) across 10ms windows
  const windowSize = Math.floor(sampleRate * 0.01)
  const energies: number[] = []

  for (let i = 0; i + windowSize < channelData.length; i += windowSize) {
    let rms = 0
    for (let j = i; j < i + windowSize; j++) {
      rms += channelData[j] ** 2
    }
    energies.push(Math.sqrt(rms / windowSize))
  }

  // Find onsets: energy spikes significantly above local average
  const onsetTimes: number[] = []
  const lookback = 20
  const threshold = 1.5

  for (let i = lookback; i < energies.length; i++) {
    const localAvg =
      energies.slice(i - lookback, i).reduce((a, b) => a + b, 0) / lookback
    if (energies[i] > localAvg * threshold && energies[i] > 0.01) {
      const timeSec = (i * windowSize) / sampleRate
      const lastOnset = onsetTimes[onsetTimes.length - 1] ?? -1
      if (timeSec - lastOnset > 0.1) {
        onsetTimes.push(timeSec)
      }
    }
  }

  let estimatedBPM = 0
  if (onsetTimes.length > 2) {
    const intervals: number[] = []
    for (let i = 1; i < onsetTimes.length; i++) {
      intervals.push(onsetTimes[i] - onsetTimes[i - 1])
    }
    const medianInterval = intervals.sort((a, b) => a - b)[
      Math.floor(intervals.length / 2)
    ]
    const rawBPM = 60 / medianInterval
    // Clamp to realistic guitar BPM range and round to nearest 5
    if (rawBPM > 30 && rawBPM < 300) {
      estimatedBPM = Math.round(rawBPM / 5) * 5
    }
  }

  // ── Dynamic range ───────────────────────────────────────────
  // RMS of loud vs quiet sections (0–100 scale)
  const blockSize = Math.floor(sampleRate * 0.1) // 100ms blocks
  const blockRMS: number[] = []

  for (let i = 0; i + blockSize < channelData.length; i += blockSize) {
    let sum = 0
    for (let j = i; j < i + blockSize; j++) sum += channelData[j] ** 2
    blockRMS.push(Math.sqrt(sum / blockSize))
  }

  blockRMS.sort((a, b) => a - b)
  const p10 = blockRMS[Math.floor(blockRMS.length * 0.1)] ?? 0
  const p90 = blockRMS[Math.floor(blockRMS.length * 0.9)] ?? 0
  const dynamicRange =
    p10 > 0 ? Math.min(100, Math.round((p90 / p10) * 10)) : 0

  return {
    averagePitch: Math.round(averagePitch * 10) / 10,
    pitchStability,
    estimatedBPM,
    dynamicRange,
    duration: Math.round(duration * 10) / 10,
  }
}
