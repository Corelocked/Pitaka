import { useRef, useEffect } from 'react'

function seededPerm(seed = 42) {
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  let j = 0
  // simple LCG for deterministic shuffle
  let s = seed >>> 0
  const rand = () => {
    s = (1664525 * s + 1013904223) >>> 0
    return s / 0xffffffff
  }
  for (let i = 255; i > 0; i--) {
    j = Math.floor(rand() * (i + 1))
    const tmp = p[i]
    p[i] = p[j]
    p[j] = tmp
  }
  const perm = new Uint8Array(512)
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  return perm
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(a, b, t) {
  return a + t * (b - a)
}

const GRAD = [
  [1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]
]

function grad(hash, x, y) {
  const g = GRAD[hash & 7]
  return g[0] * x + g[1] * y
}

function perlin2(perm, x, y) {
  const xi = Math.floor(x) & 255
  const yi = Math.floor(y) & 255
  const xf = x - Math.floor(x)
  const yf = y - Math.floor(y)

  const topRight = perm[perm[xi + 1] + yi + 1]
  const topLeft = perm[perm[xi] + yi + 1]
  const bottomRight = perm[perm[xi + 1] + yi]
  const bottomLeft = perm[perm[xi] + yi]

  const u = fade(xf)
  const v = fade(yf)

  const x1 = lerp(grad(bottomLeft, xf, yf), grad(bottomRight, xf - 1, yf), u)
  const x2 = lerp(grad(topLeft, xf, yf - 1), grad(topRight, xf - 1, yf - 1), u)
  return lerp(x1, x2, v)
}

function noise(perm, x, y, octaves = 3, persistence = 0.5) {
  let total = 0
  let frequency = 1
  let amplitude = 1
  let max = 0
  for (let i = 0; i < octaves; i++) {
    total += perlin2(perm, x * frequency, y * frequency) * amplitude
    max += amplitude
    amplitude *= persistence
    frequency *= 2
  }
  return total / max
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const bigint = parseInt(h, 16)
  if (h.length === 6) {
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
  }
  return [0,0,0]
}

export default function PerlinBackground({
  // use a brighter-to-deeper blue range for more visible contrast
  colorA = '#93c5fd',
  colorB = '#1e3a8a',
  // increase alpha to make the noise layer more noticeable
  alpha = 0.22,
  // slower movement for a calmer Perlin drift
  speed = 0.12,
  scale = 0.008,
  octaves = 4
}) {
  const ref = useRef(null)
  const permRef = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let dpr = Math.max(1, window.devicePixelRatio || 1)

    function resize() {
      dpr = Math.max(1, window.devicePixelRatio || 1)
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    if (!permRef.current) permRef.current = seededPerm(1337)
    const perm = permRef.current

    const aRGB = hexToRgb(colorA)
    const bRGB = hexToRgb(colorB)

    let raf = null
    let start = performance.now()

    // offscreen sampling resolution step (higher => cheaper)
    const sampleStep = 3

    function draw(now) {
      const t = (now - start) / 1000
      const w = Math.ceil(canvas.width / dpr)
      const h = Math.ceil(canvas.height / dpr)

      // create small ImageData and scale it to canvas for performance
      const sw = Math.ceil(w / sampleStep)
      const sh = Math.ceil(h / sampleStep)
      const off = document.createElement('canvas')
      off.width = sw
      off.height = sh
      const octx = off.getContext('2d')
      const img = octx.createImageData(sw, sh)
      const data = img.data

      let idx = 0
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const nx = x * sampleStep * scale
          const ny = y * sampleStep * scale
          // animate by offsetting coords with time
          const v = noise(perm, nx + t * speed, ny + t * speed * 0.7, octaves, 0.5)
          // normalize from approx [-1,1] to [0,1]
          let val = Math.max(0, Math.min(1, (v + 1) / 2))
          // boost mid/high contrast so patterns pop more
          const contrast = 1.6
          val = (val - 0.5) * contrast + 0.5
          val = Math.max(0, Math.min(1, val))
          // slight gamma correction for richer tones
          val = Math.pow(val, 0.95)
          // color mix
          const r = Math.round(lerp(aRGB[0], bRGB[0], val))
          const g = Math.round(lerp(aRGB[1], bRGB[1], val))
          const b = Math.round(lerp(aRGB[2], bRGB[2], val))
          data[idx++] = r
          data[idx++] = g
          data[idx++] = b
          data[idx++] = Math.round(255 * alpha)
        }
      }

      octx.putImageData(img, 0, 0)

      // draw to main canvas stretched
      ctx.clearRect(0, 0, w, h)
      // subtle blend with underlying CSS gradient
      ctx.globalAlpha = 1
      ctx.drawImage(off, 0, 0, w, h)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [colorA, colorB, alpha, speed, scale, octaves])

  return (
    <canvas ref={ref} className="perlin-canvas" aria-hidden="true" />
  )
}
