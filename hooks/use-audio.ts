"use client"

import { useState, useRef, useEffect } from "react"

const BACKGROUND_MUSIC_URL = "https://storage.googleapis.com/namnt-line98/_next/static/sound/Vibe.mp3"
const MOVE_SOUND_URL = "https://storage.googleapis.com/namnt-line98/_next/static/sound/fast-punch.wav"
const SCORE_SOUND_URL = "https://storage.googleapis.com/namnt-line98/_next/static/sound/get-point.wav"

export function useAudio() {
  const [isMuted, setIsMuted] = useState(false)
  const scoreAudioRef = useRef<HTMLAudioElement | null>(null)
  const moveAudioRef = useRef<HTMLAudioElement | null>(null)
  const bgMusicRef = useRef<HTMLAudioElement | null>(null)
  const audioInitializedRef = useRef(false)

  // Initialize audio elements
  useEffect(() => {
    // Create audio elements
    scoreAudioRef.current = new Audio(SCORE_SOUND_URL)
    moveAudioRef.current = new Audio(MOVE_SOUND_URL)
    bgMusicRef.current = new Audio(BACKGROUND_MUSIC_URL)

    if (bgMusicRef.current) {
      bgMusicRef.current.loop = true
      bgMusicRef.current.volume = 0.5 // Set volume to 50%
    }

    // Apply initial mute state to all audio elements
    if (scoreAudioRef.current) scoreAudioRef.current.muted = isMuted
    if (moveAudioRef.current) moveAudioRef.current.muted = isMuted
    if (bgMusicRef.current) bgMusicRef.current.muted = isMuted

    audioInitializedRef.current = true

    return () => {
      // Cleanup audio
      if (scoreAudioRef.current) {
        scoreAudioRef.current.pause()
        scoreAudioRef.current = null
      }
      if (moveAudioRef.current) {
        moveAudioRef.current.pause()
        moveAudioRef.current = null
      }
      if (bgMusicRef.current) {
        bgMusicRef.current.pause()
        bgMusicRef.current = null
      }
    }
  }, [])

  // Add event listener for user interaction to start music
  useEffect(() => {
    if (!audioInitializedRef.current) return

    const handleUserInteraction = () => {
      if (bgMusicRef.current && !isMuted) {
        bgMusicRef.current.play().catch((e) => {
          console.log("Background music autoplay failed:", e)
        })
      }
      // Remove the event listeners after first interaction
      document.removeEventListener("click", handleUserInteraction)
      document.removeEventListener("keydown", handleUserInteraction)
    }

    document.addEventListener("click", handleUserInteraction)
    document.addEventListener("keydown", handleUserInteraction)

    return () => {
      // Remove event listeners
      document.removeEventListener("click", handleUserInteraction)
      document.removeEventListener("keydown", handleUserInteraction)
    }
  }, [isMuted])

  // Update audio mute state when isMuted changes
  useEffect(() => {
    if (!audioInitializedRef.current) return

    // Apply mute state to all audio elements
    if (scoreAudioRef.current) scoreAudioRef.current.muted = isMuted
    if (moveAudioRef.current) moveAudioRef.current.muted = isMuted

    if (bgMusicRef.current) {
      bgMusicRef.current.muted = isMuted

      // Handle background music playback
      if (isMuted) {
        // Just mute but don't pause to maintain position in the track
        bgMusicRef.current.muted = true
      } else {
        bgMusicRef.current.muted = false
        bgMusicRef.current.play().catch((e) => {
          console.log("Background music play failed:", e)
        })
      }
    }
  }, [isMuted])

  const toggleMute = () => {
    setIsMuted((prevMuted) => !prevMuted)
  }

  const playScoreSound = () => {
    if (scoreAudioRef.current && !isMuted) {
      scoreAudioRef.current.currentTime = 0
      scoreAudioRef.current.play().catch((e) => {
        console.log("Score sound playback failed:", e)
      })
    }
  }

  const playMoveSound = () => {
    if (moveAudioRef.current && !isMuted) {
      moveAudioRef.current.currentTime = 0
      moveAudioRef.current.play().catch((e) => {
        console.log("Move sound playback failed:", e)
      })
    }
  }

  return {
    isMuted,
    toggleMute,
    playScoreSound,
    playMoveSound,
  }
}
