import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'mediapipe-selfie': ['@mediapipe/selfie_segmentation'],
          'mediapipe-face': ['@mediapipe/face_mesh'],
          'mediapipe-camera': ['@mediapipe/camera_utils'],
        }
      }
    }
  }
})
