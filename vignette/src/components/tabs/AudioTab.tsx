import React from 'react';
import { useProjectStore, defaultVoicePersonas } from '../../store/useStore';
import { Mic, Music, Volume2, Waves, Play, Pause, Settings } from 'lucide-react';
import './AudioTab.css';

export const AudioTab: React.FC = () => {
  const { 
    narrationText,
    selectedVoice,
    audioTracks,
    duckingEnabled,
    duckingDepth,
    generateNarration,
    updateNarrationText,
    selectVoice,
    addAudioTrack,
    updateAudioTrack,
    setDucking,
    previewAudio,
    setCurrentTab,
    isLoading,
    executionMode
  } = useProjectStore();
  
  const [isPlaying, setIsPlaying] = React.useState(false);
  
  const handleGenerateNarration = async () => {
    await generateNarration();
  };
  
  const handleProceedToPreview = () => {
    setCurrentTab('preview');
  };
  
  const handleAddBackgroundMusic = () => {
    const musicTracks = [
      { id: 'm1', name: 'Ambient Chill', type: 'music' as const },
      { id: 'm2', name: 'Upbeat Energy', type: 'music' as const },
      { id: 'm3', name: 'Cinematic Drama', type: 'music' as const },
    ];
    
    const track = musicTracks[0];
    addAudioTrack({
      id: `track_${Date.now()}`,
      name: track.name,
      type: track.type,
      volume: 0.5,
      startTime: 0,
      duration: 60,
    });
  };
  
  return (
    <div className="audio-tab">
      <div className="tab-header">
        <h1>Audio</h1>
        <p className="tab-description">Synthesize narration, select background music, and mix the complete audio track</p>
      </div>
      
      {/* Narration Section */}
      <section className="audio-section">
        <div className="section-header">
          <h2>
            <Mic size={20} />
            Narration
          </h2>
          <button
            className="action-btn secondary"
            onClick={handleGenerateNarration}
            disabled={isLoading}
          >
            <Settings size={16} />
            {isLoading ? 'Generating...' : 'Regenerate'}
          </button>
        </div>
        
        <textarea
          value={narrationText}
          onChange={(e) => updateNarrationText(e.target.value)}
          placeholder="Enter or edit narration text here... Use [pause] for pause tokens."
          className="narration-editor"
          rows={8}
        />
        
        <div className="narration-hints">
          <p>💡 Tip: Use <code>[pause]</code> or <code>[...]</code> to insert pause tokens for timing</p>
        </div>
      </section>
      
      {/* Voice Selection */}
      <section className="audio-section">
        <div className="section-header">
          <h2>Voice Persona</h2>
        </div>
        
        <div className="voice-grid">
          {defaultVoicePersonas.map(voice => (
            <button
              key={voice.id}
              className={`voice-card ${selectedVoice?.id === voice.id ? 'selected' : ''}`}
              onClick={() => selectVoice(voice)}
            >
              <div className="voice-icon">
                <Mic size={24} />
              </div>
              <h4>{voice.name}</h4>
              <div className="voice-params">
                <span>Pitch: {voice.pitch}</span>
                <span>Speed: {voice.speed}x</span>
              </div>
              {selectedVoice?.id === voice.id && (
                <div className="selected-badge">✓ Selected</div>
              )}
            </button>
          ))}
        </div>
        
        <button
          className="action-btn primary"
          onClick={() => previewAudio()}
          disabled={!selectedVoice}
        >
          <Play size={18} />
          Preview Voice
        </button>
      </section>
      
      {/* Background Music */}
      <section className="audio-section">
        <div className="section-header">
          <h2>
            <Music size={20} />
            Background Music
          </h2>
          <button
            className="action-btn small"
            onClick={handleAddBackgroundMusic}
          >
            + Add Track
          </button>
        </div>
        
        {audioTracks.filter(t => t.type === 'music').length > 0 ? (
          <div className="tracks-list">
            {audioTracks.filter(t => t.type === 'music').map(track => (
              <div key={track.id} className="track-card">
                <div className="track-info">
                  <Music size={20} />
                  <span>{track.name}</span>
                </div>
                <div className="track-controls">
                  <label>Volume:</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={track.volume}
                    onChange={(e) => updateAudioTrack(track.id, { volume: parseFloat(e.target.value) })}
                  />
                  <span>{Math.round(track.volume * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state small">
            <Music size={40} />
            <p>No background music added yet</p>
            <button
              className="action-btn small"
              onClick={handleAddBackgroundMusic}
            >
              Add Background Music
            </button>
          </div>
        )}
      </section>
      
      {/* Audio Mixing */}
      <section className="audio-section">
        <div className="section-header">
          <h2>
            <Volume2 size={20} />
            Audio Mix
          </h2>
        </div>
        
        <div className="mix-controls">
          <div className="mix-channel">
            <label>Voice</label>
            <input type="range" min="0" max="1" step="0.1" defaultValue="1" />
            <span>100%</span>
          </div>
          
          <div className="mix-channel">
            <label>Music</label>
            <input type="range" min="0" max="1" step="0.1" defaultValue="0.5" />
            <span>50%</span>
          </div>
          
          <div className="mix-channel">
            <label>SFX</label>
            <input type="range" min="0" max="1" step="0.1" defaultValue="0.8" />
            <span>80%</span>
          </div>
        </div>
        
        <div className="ducking-control">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={duckingEnabled}
              onChange={(e) => setDucking(e.target.checked)}
            />
            <span>Enable Auto-Ducking</span>
          </label>
          
          {duckingEnabled && (
            <div className="ducking-depth">
              <label>Ducking Depth:</label>
              <input
                type="range"
                min="-20"
                max="0"
                step="1"
                value={duckingDepth}
                onChange={(e) => setDucking(true, parseInt(e.target.value))}
              />
              <span>{duckingDepth}dB</span>
            </div>
          )}
          
          <p className="ducking-hint">
            Auto-ducking automatically lowers background music during narration
          </p>
        </div>
      </section>
      
      {/* Waveform Preview */}
      <section className="audio-section">
        <div className="section-header">
          <h2>
            <Waves size={20} />
            Audio Timeline
          </h2>
          <button
            className="action-btn icon"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>
        
        <div className="waveform-container">
          <div className="waveform-track narration">
            <span className="track-label">Narration</span>
            <div className="waveform-visual">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{ height: `${20 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          </div>
          
          {audioTracks.filter(t => t.type === 'music').map(track => (
            <div key={track.id} className="waveform-track music">
              <span className="track-label">{track.name}</span>
              <div className="waveform-visual">
                {[...Array(50)].map((_, i) => (
                  <div
                    key={i}
                    className="waveform-bar"
                    style={{ height: `${10 + Math.random() * 40}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Action Buttons */}
      {executionMode === 'step-by-step' && narrationText && (
        <div className="approval-notice">
          <span>✓ Audio configured. Review mix settings, then proceed.</span>
        </div>
      )}
      
      <div className="tab-actions">
        <button
          className="proceed-btn"
          onClick={handleProceedToPreview}
        >
          Proceed to Preview
        </button>
      </div>
    </div>
  );
};
