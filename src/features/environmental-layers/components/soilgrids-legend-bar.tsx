import { useEffect, useRef } from 'react'

import type { EnvironmentalLayer } from '@/features/environmental-layers/types/environmental-layer'

import './soilgrids-legend-bar.css'

interface SoilGridsLegendBarProps {
  layer: EnvironmentalLayer
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function buildFallbackStops(layer: EnvironmentalLayer) {
  if (layer.propertyId === 'clay') {
    return ['#6b3f15', '#a5662b', '#d59d53', '#e7bf80', '#f1d7a7', '#f8e9c5']
  }

  if (layer.propertyId === 'sand') {
    return ['#4f2b1f', '#8b4f2d', '#c87b3d', '#e9ad66', '#f2d29a', '#f7e8c7']
  }

  if (layer.propertyId === 'phh2o') {
    return ['#6e3b1f', '#aa6932', '#d8a15a', '#c9d2c8', '#79a0a5', '#2f6f7d']
  }

  if (layer.propertyId === 'soc' || layer.propertyId === 'ocs' || layer.propertyId === 'ocd') {
    return ['#efe6cf', '#d8c49f', '#b49061', '#865f3d', '#5a3925', '#2d1f18']
  }

  if (layer.statisticId === 'uncertainty') {
    return ['#f7fbff', '#dce9f3', '#bdd7e7', '#6baed6', '#3182bd', '#08519c']
  }

  return ['#efe7d1', '#dac79f', '#c5aa72', '#a57f52', '#7f603f', '#554134']
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`
}

async function extractLegendStops(legendUrl: string) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const nextImage = new Image()
    nextImage.crossOrigin = 'anonymous'
    nextImage.onload = () => resolve(nextImage)
    nextImage.onerror = () => reject(new Error('Legend image could not be loaded.'))
    nextImage.src = legendUrl
  })

  const canvas = document.createElement('canvas')
  const width = image.naturalWidth
  const height = image.naturalHeight
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Legend canvas context could not be created.')
  }

  context.drawImage(image, 0, 0, width, height)

  const sampleCount = 8
  const sampleStartX = Math.max(1, Math.floor(width * 0.12))
  const sampleEndX = Math.max(sampleStartX + 1, Math.floor(width * 0.28))
  const stops: string[] = []

  for (let index = 0; index < sampleCount; index += 1) {
    const y = clamp(
      Math.floor(((index + 0.5) / sampleCount) * height),
      0,
      height - 1,
    )
    let totalRed = 0
    let totalGreen = 0
    let totalBlue = 0
    let countedPixels = 0

    for (let sampleX = sampleStartX; sampleX <= sampleEndX; sampleX += 1) {
      const [red, green, blue, alpha] = context.getImageData(sampleX, y, 1, 1).data

      if (alpha < 8) {
        continue
      }

      totalRed += red
      totalGreen += green
      totalBlue += blue
      countedPixels += 1
    }

    if (countedPixels === 0) {
      continue
    }

    stops.push(
      rgbToHex(
        totalRed / countedPixels,
        totalGreen / countedPixels,
        totalBlue / countedPixels,
      ),
    )
  }

  return stops
}

function drawLegendTrack(canvas: HTMLCanvasElement, stops: string[]) {
  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  const safeStops = stops.length > 1 ? stops : [stops[0] ?? '#c7b18b', '#6b5239']
  const width = canvas.width
  const height = canvas.height
  const gradient = context.createLinearGradient(0, 0, width, 0)

  safeStops.forEach((color, index) => {
    const offset = safeStops.length === 1 ? 0 : index / (safeStops.length - 1)
    gradient.addColorStop(offset, color)
  })

  context.clearRect(0, 0, width, height)
  context.fillStyle = gradient
  context.beginPath()
  const radius = height / 2
  context.moveTo(radius, 0)
  context.lineTo(width - radius, 0)
  context.quadraticCurveTo(width, 0, width, radius)
  context.lineTo(width, height - radius)
  context.quadraticCurveTo(width, height, width - radius, height)
  context.lineTo(radius, height)
  context.quadraticCurveTo(0, height, 0, height - radius)
  context.lineTo(0, radius)
  context.quadraticCurveTo(0, 0, radius, 0)
  context.closePath()
  context.fill()

  context.strokeStyle = 'rgba(24, 49, 42, 0.14)'
  context.lineWidth = 1
  context.stroke()
}

export function SoilGridsLegendBar({ layer }: SoilGridsLegendBarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function syncLegend() {
      try {
        const stops = await extractLegendStops(layer.legend.url)

        if (!isCancelled && canvasRef.current && stops.length > 0) {
          drawLegendTrack(canvasRef.current, stops)
        }
      } catch {
        if (!isCancelled && canvasRef.current) {
          drawLegendTrack(canvasRef.current, buildFallbackStops(layer))
        }
      }
    }

    if (canvasRef.current) {
      drawLegendTrack(canvasRef.current, buildFallbackStops(layer))
    }

    void syncLegend()

    return () => {
      isCancelled = true
    }
  }, [layer])

  return (
    <div className="soilgrids-legend-bar">
      <canvas
        aria-hidden="true"
        className="soilgrids-legend-bar__track"
        height={14}
        ref={canvasRef}
        width={280}
      />
      <div className="soilgrids-legend-bar__labels">
        <span>Official ISRIC colors</span>
        <span>{layer.statisticLabel}</span>
      </div>
    </div>
  )
}
