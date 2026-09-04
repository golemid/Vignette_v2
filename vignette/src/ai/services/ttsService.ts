/**
 * TTS Service - Text-to-Speech Synthesis
 * 
 * Uses the TTS model to synthesize narration audio.
 * Applies persona customization (pitch, speed) via Web Audio offline rendering.
 */

import { getAIBridge } from '../aiBridge';

export interface TTSPersona {
  id: string;
  name: string;
  pitch: number; // 0.5 - 2.0
  speed: number; // 0.5 - 2.0
}

export interface TTSResult {
  audioBlob: Blob;
  duration: number; // seconds
}

const defaultPersonas: TTSPersona[] = [
  { id: 'narrator', name: 'Narrator (Neutral)', pitch: 1.0, speed: 1.0 },
  { id: 'energetic', name: 'Energetic Host', pitch: 1.1, speed: 1.15 },
  { id: 'calm', name: 'Calm Storyteller', pitch: 0.95, speed: 0.9 },
  { id: 'dramatic', name: 'Dramatic Voice', pitch: 0.85, speed: 0.85 },
];

export const getTTSPersonas = (): TTSPersona[] => defaultPersonas;

/**
 * Synthesize speech from text using the TTS model
 */
export const synthesizeSpeech = async (
  text: string,
  persona?: TTSPersona
): Promise<TTSResult> => {
  if (!text.trim()) {
    throw new Error('Empty text provided for TTS');
  }
  
  try {
    const bridge = getAIBridge();
    
    const pitch = persona?.pitch ?? 1.0;
    const speed = persona?.speed ?? 1.0;
    
    const result = await bridge.synthesizeSpeech(text, pitch, speed);
    
    if (!result.audioBlob || !(result.audioBlob instanceof Blob)) {
      throw new Error('Invalid audio blob returned from TTS');
    }
    
    // Get duration from audio metadata
    const duration = await getAudioDuration(result.audioBlob);
    
    return {
      audioBlob: result.audioBlob,
      duration,
    };
  } catch (error: any) {
    console.error('TTS synthesis failed:', error);
    throw new Error(`Failed to synthesize speech: ${error.message}`);
  }
};

/**
 * Get audio duration from a blob
 */
const getAudioDuration = async (audioBlob: Blob): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(audioBlob);
    
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
      URL.revokeObjectURL(audio.src);
    });
    
    audio.addEventListener('error', () => {
      // If we can't get duration, estimate from typical speech rate
      // ~150 words per minute, average word ~0.4 seconds
      const wordCount = audioBlob.size / 5; // Rough estimate
      resolve(wordCount * 0.4);
    });
  });
};

/**
 * Apply persona effects to audio using Web Audio API offline rendering
 * This is a fallback/enhancement if the TTS model doesn't support pitch/speed natively
 */
export const applyPersonaEffects = async (
  audioBlob: Blob,
  persona: TTSPersona
): Promise<Blob> => {
  try {
    const audioContext = new OfflineAudioContext(1, 44100 * 60, 44100); // 60 seconds max
    const audioBuffer = await audioBlob.arrayBuffer();
    const decodedBuffer = await audioContext.decodeAudioData(audioBuffer.slice(0));
    
    // Create source
    const source = audioContext.createBufferSource();
    source.buffer = decodedBuffer;
    
    // Apply playback rate for speed adjustment
    source.playbackRate.value = persona.speed;
    
    // For pitch shifting without affecting speed, we'd need a more complex setup
    // For now, we'll use simple playback rate which affects both
    
    source.connect(audioContext.destination);
    source.start(0);
    
    const renderedBuffer = await audioContext.startRendering();
    
    // Convert back to blob
    const wavBlob = bufferToWav(renderedBuffer);
    return wavBlob;
  } catch (error: any) {
    console.warn('Failed to apply persona effects, returning original audio:', error);
    return audioBlob;
  }
};

/**
 * Convert AudioBuffer to WAV blob
 */
const bufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const data = [];
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i];
      // Clamp to [-1, 1]
      const clamped = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit integer
      const intSample = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      data.push(intSample & 0xff, (intSample >> 8) & 0xff);
    }
  }
  
  const dataLength = data.length;
  const headerSize = 44;
  const totalSize = headerSize + dataLength;
  
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // File size
  view.setUint32(4, 36 + dataLength, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // Format chunk identifier
  writeString(view, 12, 'fmt ');
  // Format chunk length
  view.setUint32(16, 16, true);
  // Sample format (raw)
  view.setUint16(20, format, true);
  // Channel count
  view.setUint16(22, numChannels, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate
  view.setUint32(28, sampleRate * blockAlign, true);
  // Block align
  view.setUint16(32, blockAlign, true);
  // Bit depth
  view.setUint16(34, bitDepth, true);
  // Data chunk identifier
  writeString(view, 36, 'data');
  // Data chunk length
  view.setUint32(40, dataLength, true);
  
  // Write samples
  let offset = 44;
  for (let i = 0; i < dataLength; i++) {
    view.setUint8(offset++, data[i]);
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

/**
 * Preview TTS audio by playing it
 */
export const previewTTS = async (audioBlob: Blob): Promise<void> => {
  const audio = new Audio(URL.createObjectURL(audioBlob));
  await audio.play();
};

/**
 * Export TTS audio as a downloadable file
 */
export const exportTTSAudio = (audioBlob: Blob, filename: string = 'narration.wav'): void => {
  const url = URL.createObjectURL(audioBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
