import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type AspectRatio = '9:16' | '16:9';
export type ExecutionMode = 'auto-pilot' | 'step-by-step';

export interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'audio';
  file: File;
  proxyUrl?: string;
  originalUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  description?: string;
  hookScore?: number;
}

export interface Group {
  id: string;
  name: string;
  imageIds: string[];
  stylePreset?: string;
  hookImageId?: string;
}

export interface Transition {
  id: string;
  type: string;
  duration: number;
  layer: 'background' | 'subject' | 'effects' | 'typography';
  description: string;
  startTime: number;
  endTime: number;
}

export interface EDLClip {
  id: string;
  groupId: string;
  imageId: string;
  startTime: number;
  duration: number;
  transitions: Transition[];
  focalPoint?: { x: number; y: number };
  motionPath?: { x: number; y: number }[];
  typography?: {
    text: string;
    position: { x: number; y: number };
    duration: number;
  };
}

export interface VoicePersona {
  id: string;
  name: string;
  pitch: number;
  speed: number;
}

export interface AudioTrack {
  id: string;
  name: string;
  type: 'narration' | 'music' | 'sfx' | 'ambient';
  url?: string;
  volume: number;
  startTime: number;
  duration: number;
}

export interface ProjectState {
  // Tab 1: Catalog
  mediaFiles: MediaFile[];
  aspectRatio: AspectRatio;
  
  // Tab 2: Groups
  groups: Group[];
  visualStylePreset: string;
  
  // Tab 3: Script
  edlClips: EDLClip[];
  scriptKeywords: string;
  thematicScript: string;
  
  // Tab 4: Audio
  narrationText: string;
  selectedVoice: VoicePersona | null;
  audioTracks: AudioTrack[];
  duckingEnabled: boolean;
  duckingDepth: number;
  
  // Tab 5: Preview
  previewResolution: '720p' | '1080p' | '4K';
  previewFrameRate: 24 | 30 | 60;
  previewCodec: 'h264' | 'h265';
  isPreviewReady: boolean;
  
  // Tab 6: Project
  executionMode: ExecutionMode;
  projectName: string;
  projectHistory: string[];
  autoSaveEnabled: boolean;
  
  // UI State
  currentTab: 'catalog' | 'groups' | 'script' | 'audio' | 'preview' | 'project' | 'terminal';
  isLoading: boolean;
  validationErrors: string[];
}

const defaultVoicePersonas: VoicePersona[] = [
  { id: 'v1', name: 'Narrator (Neutral)', pitch: 1.0, speed: 1.0 },
  { id: 'v2', name: 'Energetic Host', pitch: 1.1, speed: 1.15 },
  { id: 'v3', name: 'Calm Storyteller', pitch: 0.95, speed: 0.9 },
  { id: 'v4', name: 'Dramatic Voice', pitch: 0.85, speed: 0.85 },
];

// Get available system voices from Web Speech API
const getSystemVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.getVoices();
  }
  return [];
};

// Filter for high-quality voices
const getHighQualityVoices = (): SpeechSynthesisVoice[] => {
  const voices = getSystemVoices();
  // Prefer premium/high quality voices, filter by language
  return voices.filter(voice => 
    voice.default || 
    voice.name.toLowerCase().includes('premium') ||
    voice.name.toLowerCase().includes('enhanced') ||
    voice.name.toLowerCase().includes('google') ||
    voice.name.toLowerCase().includes('microsoft')
  );
};

const initialState: ProjectState = {
  // Tab 1: Catalog
  mediaFiles: [],
  aspectRatio: '9:16',
  
  // Tab 2: Groups
  groups: [],
  visualStylePreset: 'default',
  
  // Tab 3: Script
  edlClips: [],
  scriptKeywords: '',
  thematicScript: '',
  
  // Tab 4: Audio
  narrationText: '',
  selectedVoice: null,
  audioTracks: [],
  duckingEnabled: true,
  duckingDepth: -12,
  
  // Tab 5: Preview
  previewResolution: '1080p',
  previewFrameRate: 30,
  previewCodec: 'h264',
  isPreviewReady: false,
  
  // Tab 6: Project
  executionMode: 'step-by-step',
  projectName: 'Untitled Project',
  projectHistory: [],
  autoSaveEnabled: true,
  
  // UI State
  currentTab: 'catalog',
  isLoading: false,
  validationErrors: [],
};

interface ProjectActions {
  // Catalog Actions
  addMediaFiles: (files: File[]) => Promise<void>;
  removeMediaFile: (id: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  
  // Groups Actions
  generateGroups: () => Promise<void>;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  mergeGroups: (group1Id: string, group2Id: string) => void;
  splitGroup: (groupId: string, imageIds: string[]) => void;
  moveImageBetweenGroups: (imageId: string, fromGroupId: string, toGroupId: string) => void;
  setVisualStylePreset: (preset: string) => void;
  
  // Script Actions
  generateEDL: () => Promise<void>;
  updateEDLClip: (clipId: string, updates: Partial<EDLClip>) => void;
  setScriptKeywords: (keywords: string) => void;
  approveScript: () => void;
  
  // Audio Actions
  generateNarration: () => Promise<void>;
  updateNarrationText: (text: string) => void;
  selectVoice: (voice: VoicePersona) => void;
  addAudioTrack: (track: AudioTrack) => void;
  updateAudioTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  removeAudioTrack: (trackId: string) => void;
  setDucking: (enabled: boolean, depth?: number) => void;
  previewAudio: () => void;
  
  // Preview Actions
  generatePreview: () => Promise<void>;
  setPreviewSettings: (settings: Partial<Pick<ProjectState, 'previewResolution' | 'previewFrameRate' | 'previewCodec'>>) => void;
  validateProject: () => string[];
  
  // Project Actions
  saveProject: () => void;
  loadProject: (projectData: ProjectState) => void;
  setExecutionMode: (mode: ExecutionMode) => void;
  setProjectName: (name: string) => void;
  
  // Navigation
  setCurrentTab: (tab: ProjectState['currentTab']) => void;
  setLoading: (loading: boolean) => void;
  addValidationError: (error: string) => void;
  clearValidationErrors: () => void;
}

export const useProjectStore = create<ProjectState & ProjectActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,
      
      // Catalog Actions
      addMediaFiles: async (files: File[]) => {
      set(state => { state.isLoading = true; });
      
      const newFiles: MediaFile[] = [];
      
      for (const file of files) {
        const isImage = file.type.startsWith('image/');
        const isAudio = file.type.startsWith('audio/');
        
        if (!isImage && !isAudio) continue;
        
        const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const mediaFile: MediaFile = {
          id,
          name: file.name,
          type: isImage ? 'image' : 'audio',
          file,
        };
        
        // Generate proxy for images
        if (isImage) {
          try {
            const proxyUrl = await generateProxy(file);
            mediaFile.proxyUrl = proxyUrl;
            mediaFile.originalUrl = URL.createObjectURL(file);
            
            // Get image dimensions
            const img = await loadImage(proxyUrl);
            mediaFile.width = img.width;
            mediaFile.height = img.height;
          } catch (error) {
            console.error('Error generating proxy:', error);
            continue;
          }
        } else {
          mediaFile.originalUrl = URL.createObjectURL(file);
        }
        
        newFiles.push(mediaFile);
      }
      
      set(state => {
        state.mediaFiles = [...state.mediaFiles, ...newFiles];
        state.isLoading = false;
      });
    },
    
    removeMediaFile: (id: string) => {
      set(state => {
        const file = state.mediaFiles.find(f => f.id === id);
        if (file?.originalUrl) URL.revokeObjectURL(file.originalUrl);
        if (file?.proxyUrl) URL.revokeObjectURL(file.proxyUrl);
        state.mediaFiles = state.mediaFiles.filter(f => f.id !== id);
      });
    },
    
    setAspectRatio: (ratio: AspectRatio) => {
      set(state => { state.aspectRatio = ratio; });
    },
    
    // Groups Actions
    generateGroups: async () => {
      set(state => { state.isLoading = true; });
      
      // Simulate AI grouping (in real app, this would call a Vision LLM)
      const images = get().mediaFiles.filter(f => f.type === 'image');
      const newGroups: Group[] = [];
      
      // Simple clustering simulation - group by similar names or random
      const clusterSize = Math.max(3, Math.min(Math.ceil(images.length / 3), 10));
      
      for (let i = 0; i < images.length; i += clusterSize) {
        const clusterImages = images.slice(i, i + clusterSize);
        const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        newGroups.push({
          id: groupId,
          name: `Story ${newGroups.length + 1}`,
          imageIds: clusterImages.map(img => img.id),
          stylePreset: get().visualStylePreset,
          hookImageId: clusterImages[0]?.id, // Default first image as hook
        });
      }
      
      set(state => {
        state.groups = newGroups;
        state.isLoading = false;
      });
      
      // In step-by-step mode, pause for review
      if (get().executionMode === 'step-by-step') {
        console.log('AI grouping complete. Please review and adjust.');
      }
    },
    
    updateGroup: (groupId: string, updates: Partial<Group>) => {
      set(state => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          Object.assign(group, updates);
        }
      });
    },
    
    mergeGroups: (group1Id: string, group2Id: string) => {
      set(state => {
        const group1 = state.groups.find(g => g.id === group1Id);
        const group2 = state.groups.find(g => g.id === group2Id);
        
        if (group1 && group2) {
          group1.imageIds = [...group1.imageIds, ...group2.imageIds];
          group1.name = `${group1.name} + ${group2.name}`;
          state.groups = state.groups.filter(g => g.id !== group2Id);
        }
      });
    },
    
    splitGroup: (groupId: string, imageIds: string[]) => {
      set(state => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          const remainingIds = group.imageIds.filter(id => !imageIds.includes(id));
          
          if (remainingIds.length >= 2 && imageIds.length >= 2) {
            const newGroupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            group.imageIds = remainingIds;
            
            state.groups.push({
              id: newGroupId,
              name: `${group.name} (Split)`,
              imageIds,
              stylePreset: group.stylePreset,
              hookImageId: imageIds[0],
            });
          }
        }
      });
    },
    
    moveImageBetweenGroups: (imageId: string, fromGroupId: string, toGroupId: string) => {
      set(state => {
        const fromGroup = state.groups.find(g => g.id === fromGroupId);
        const toGroup = state.groups.find(g => g.id === toGroupId);
        
        if (fromGroup && toGroup) {
          fromGroup.imageIds = fromGroup.imageIds.filter(id => id !== imageId);
          toGroup.imageIds.push(imageId);
        }
      });
    },
    
    setVisualStylePreset: (preset: string) => {
      set(state => { 
        state.visualStylePreset = preset;
        state.groups.forEach(g => { g.stylePreset = preset; });
      });
    },
    
    // Script Actions
    generateEDL: async () => {
      set(state => { state.isLoading = true; });
      
      const groups = get().groups;
      const newClips: EDLClip[] = [];
      let currentTime = 0;
      
      // Simulate AI-generated EDL (in real app, this would call an LLM)
      groups.forEach(group => {
        group.imageIds.forEach((imageId, index) => {
          const clipId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const duration = index === 0 ? 3 : 2; // First image gets 3-second hook
          
          const transitions: Transition[] = [
            {
              id: `trans_bg_${clipId}`,
              type: 'fade',
              duration: 0.5,
              layer: 'background',
              description: 'Smooth background fade',
              startTime: currentTime,
              endTime: currentTime + duration,
            },
            {
              id: `trans_sub_${clipId}`,
              type: 'scale',
              duration: 0.3,
              layer: 'subject',
              description: 'Subtle zoom on focal point',
              startTime: currentTime + 0.2,
              endTime: currentTime + duration - 0.2,
            },
          ];
          
          // Add environmental typography for transitions
          if (index > 0) {
            transitions.push({
              id: `trans_typo_${clipId}`,
              type: 'slide',
              duration: 0.8,
              layer: 'typography',
              description: 'Environmental text transition',
              startTime: currentTime + duration - 0.8,
              endTime: currentTime + duration,
            });
          }
          
          newClips.push({
            id: clipId,
            groupId: group.id,
            imageId,
            startTime: currentTime,
            duration,
            transitions,
            focalPoint: { x: 0.5, y: 0.4 }, // Default focal point
            typography: index > 0 ? {
              text: `Scene ${index + 1}`,
              position: { x: 0.5, y: 0.8 },
              duration: 2,
            } : undefined,
          });
          
          currentTime += duration;
        });
      });
      
      set(state => {
        state.edlClips = newClips;
        state.thematicScript = `A visual narrative exploring ${get().scriptKeywords || 'the captured moments'}. Each scene flows seamlessly into the next, creating a cohesive story.`;
        state.isLoading = false;
      });
      
      if (get().executionMode === 'step-by-step') {
        console.log('EDL generated. Please review transitions and timing.');
      }
    },
    
    updateEDLClip: (clipId: string, updates: Partial<EDLClip>) => {
      set(state => {
        const clip = state.edlClips.find(c => c.id === clipId);
        if (clip) {
          Object.assign(clip, updates);
        }
      });
    },
    
    setScriptKeywords: (keywords: string) => {
      set(state => { state.scriptKeywords = keywords; });
    },
    
    approveScript: () => {
      console.log('Script approved and locked.');
    },
    
    // Audio Actions
    generateNarration: async () => {
      set(state => { state.isLoading = true; });
      
      // Simulate AI narration generation
      const clips = get().edlClips;
      let narration = '';
      
      clips.forEach((_clip, index) => {
        const sceneText = `\n[Scene ${index + 1}] The story unfolds...`;
        narration += sceneText;
      });
      
      set(state => {
        state.narrationText = narration.trim();
        state.selectedVoice = defaultVoicePersonas[0];
        state.isLoading = false;
      });
      
      if (get().executionMode === 'step-by-step') {
        console.log('Narration generated. Please edit text and select voice.');
      }
    },
    
    updateNarrationText: (text: string) => {
      set(state => { state.narrationText = text; });
    },
    
    selectVoice: (voice: VoicePersona) => {
      set(state => { state.selectedVoice = voice; });
    },
    
    addAudioTrack: (track: AudioTrack) => {
      set(state => { 
        state.audioTracks.push(track);
      });
    },
    
    updateAudioTrack: (trackId: string, updates: Partial<AudioTrack>) => {
      set(state => {
        const track = state.audioTracks.find(t => t.id === trackId);
        if (track) {
          Object.assign(track, updates);
        }
      });
    },
    
    removeAudioTrack: (trackId: string) => {
      set(state => {
        state.audioTracks = state.audioTracks.filter(t => t.id !== trackId);
      });
    },
    
    setDucking: (enabled: boolean, depth?: number) => {
      set(state => { 
        state.duckingEnabled = enabled;
        if (depth !== undefined) state.duckingDepth = depth;
      });
    },
    
    previewAudio: () => {
      const state = get();
      if (!state.narrationText || typeof window === 'undefined' || !window.speechSynthesis) {
        console.warn('Web Speech API not available or no narration text');
        return;
      }
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Clean narration text: strip SSML-like tags and replace with punctuation
      let cleanText = state.narrationText
        .replace(/\[.*?\]/g, '') // Remove bracketed instructions like [Scene 1]
        .replace(/<[^>]*>/g, '') // Remove any HTML/SSML tags
        .replace(/\n+/g, '. ')   // Replace newlines with periods
        .replace(/\s+/g, ' ')    // Normalize whitespace
        .trim();
      
      // Add pauses for natural speech (using punctuation)
      cleanText = cleanText.replace(/\.\.\./g, ',,,'); // Extra pauses
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Apply voice settings from selected voice persona
      if (state.selectedVoice) {
        utterance.pitch = state.selectedVoice.pitch;
        utterance.rate = state.selectedVoice.speed;
      }
      
      // Try to match a system voice to the selected persona
      const systemVoices = getSystemVoices();
      if (systemVoices.length > 0 && state.selectedVoice) {
        // Prefer English voices, match by name if possible
        const preferredVoice = systemVoices.find(v => 
          v.lang.startsWith('en') && 
          (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('male'))
        ) || systemVoices.find(v => v.lang.startsWith('en')) || systemVoices[0];
        
        utterance.voice = preferredVoice;
      }
      
      // Handle events
      utterance.onstart = () => {
        console.log('Speech synthesis started');
      };
      
      utterance.onend = () => {
        console.log('Speech synthesis completed');
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
      };
      
      window.speechSynthesis.speak(utterance);
    },
    
    stopAudio: () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        console.log('Speech synthesis stopped');
      }
    },
    
    // Preview Actions
    generatePreview: async () => {
      set(state => { state.isLoading = true; });
      
      // Simulate preview generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      set(state => {
        state.isPreviewReady = true;
        state.isLoading = false;
      });
    },
    
    setPreviewSettings: (settings: Partial<Pick<ProjectState, 'previewResolution' | 'previewFrameRate' | 'previewCodec'>>) => {
      set(state => {
        Object.assign(state, settings);
      });
    },
    
    validateProject: (): string[] => {
      const errors: string[] = [];
      const state = get();
      
      if (state.mediaFiles.length === 0) {
        errors.push('No media files imported');
      }
      
      if (state.groups.length === 0) {
        errors.push('No groups created');
      }
      
      if (state.edlClips.length === 0) {
        errors.push('No EDL clips generated');
      }
      
      set(state => {
        state.validationErrors = errors;
      });
      
      return errors;
    },
    
    // Project Actions
    saveProject: () => {
      const state = get();
      const projectData = JSON.stringify(state, null, 2);
      localStorage.setItem(`vignette_project_${state.projectName}`, projectData);
      
      set(state => {
        state.projectHistory.push(`Saved at ${new Date().toLocaleString()}`);
      });
      
      console.log('Project saved!');
    },
    
    loadProject: (projectData: ProjectState) => {
      set(state => {
        Object.assign(state, projectData);
      });
      console.log('Project loaded!');
    },
    
    setExecutionMode: (mode: ExecutionMode) => {
      set(state => { state.executionMode = mode; });
    },
    
    setProjectName: (name: string) => {
      set(state => { state.projectName = name; });
    },
    
    // Navigation
    setCurrentTab: (tab: ProjectState['currentTab']) => {
      set(state => { state.currentTab = tab; });
    },
    
    setLoading: (loading: boolean) => {
      set(state => { state.isLoading = loading; });
    },
    
    addValidationError: (error: string) => {
      set(state => {
        state.validationErrors.push(error);
      });
    },
    
    clearValidationErrors: () => {
      set(state => {
        state.validationErrors = [];
      });
    },
  })),
  {
    name: 'vignette-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      mediaFiles: state.mediaFiles.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        proxyUrl: f.proxyUrl,
        originalUrl: f.originalUrl,
        width: f.width,
        height: f.height,
        duration: f.duration,
        description: f.description,
        hookScore: f.hookScore,
      })),
      groups: state.groups,
      projectName: state.projectName,
      projectHistory: state.projectHistory,
      executionMode: state.executionMode,
      aspectRatio: state.aspectRatio,
      visualStylePreset: state.visualStylePreset,
    }),
    onRehydrateStorage: () => (_state, error) => {
      if (error) {
        console.error('Failed to rehydrate vignette-storage:', error);
      } else {
        console.log('Vignette state rehydrated successfully');
      }
    },
  })
);

// Helper functions
async function generateProxy(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      const maxSize = 512;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

export { defaultVoicePersonas };
