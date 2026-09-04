import React, { useState } from 'react';
import { useProjectStore } from '../../store/useStore';
import { Wand2, Clock, Type, Check, Edit3, AlertCircle } from 'lucide-react';
import { generateEDL as generateRealEDL, generateFallbackEDL } from '../../ai/services/textService';
import './ScriptTab.css';

export const ScriptTab: React.FC = () => {
  const { 
    groups, 
    edlClips, 
    scriptKeywords, 
    thematicScript,
    generateEDL,
    updateEDLClip,
    setScriptKeywords,
    approveScript,
    setCurrentTab,
    isLoading,
    executionMode,
    aiStatus
  } = useProjectStore();
  
  const [editingClip, setEditingClip] = useState<string | null>(null);
  const [localDuration, setLocalDuration] = useState<number>(0);
  
  const handleGenerateEDL = async () => {
    if (groups.length === 0) return;
    
    try {
      let result;
      
      if (aiStatus === 'ready') {
        // Use real AI EDL generation
        result = await generateRealEDL(groups, scriptKeywords, thematicScript);
      } else {
        // Fallback to simple generation
        result = generateFallbackEDL(groups);
      }
      
      // Update store with generated clips
      const { set } = useProjectStore.getState();
      if (set) {
        set((s: any) => {
          s.edlClips = result.clips;
        });
      }
    } catch (error: any) {
      console.error('EDL generation failed:', error);
      // Fallback
      const fallbackResult = generateFallbackEDL(groups);
      const { set } = useProjectStore.getState();
      if (set) {
        set((s: any) => {
          s.edlClips = fallbackResult.clips;
        });
      }
    }
  };
  
  const handleProceedToAudio = () => {
    if (edlClips.length > 0) {
      setCurrentTab('audio');
    }
  };
  
  const handleEditClip = (clipId: string, currentDuration: number) => {
    setEditingClip(clipId);
    setLocalDuration(currentDuration);
  };
  
  const handleSaveClipEdit = (clipId: string) => {
    updateEDLClip(clipId, { duration: localDuration });
    setEditingClip(null);
  };
  
  const totalDuration = edlClips.reduce((sum, clip) => sum + clip.duration, 0);
  
  return (
    <div className="script-tab">
      <div className="tab-header">
        <h1>Script & EDL</h1>
        <p className="tab-description">Generate and refine the Edit Decision List with transitions and timing</p>
      </div>
      
      {/* Keyword Input */}
      <div className="keyword-section">
        <label>Thematic Keywords (optional):</label>
        <input
          type="text"
          value={scriptKeywords}
          onChange={(e) => setScriptKeywords(e.target.value)}
          placeholder="e.g., adventure, nostalgia, urban, nature..."
          className="keyword-input"
        />
        <p className="keyword-hint">These keywords will guide the AI in generating your narrative script</p>
      </div>
      
      {/* Generate Button */}
      <div className="generate-section">
        <button
          className="action-btn primary"
          onClick={handleGenerateEDL}
          disabled={groups.length === 0 || isLoading}
        >
          <Wand2 size={18} />
          {isLoading ? 'Generating...' : 'Generate EDL with AI'}
        </button>
        
        {executionMode === 'step-by-step' && edlClips.length > 0 && (
          <div className="approval-notice">
            <Check size={20} />
            <span>EDL generated. Review transitions and timing below, then proceed.</span>
          </div>
        )}
      </div>
      
      {/* Thematic Script Display */}
      {thematicScript && (
        <div className="thematic-script">
          <h3>Narrative Theme</h3>
          <p>{thematicScript}</p>
        </div>
      )}
      
      {/* Timeline / EDL Display */}
      {edlClips.length > 0 ? (
        <div className="timeline-section">
          <div className="timeline-header">
            <h2>
              <Clock size={20} />
              Edit Decision List (Total: {totalDuration.toFixed(1)}s)
            </h2>
          </div>
          
          <div className="timeline-container">
            {/* Timeline Visualization */}
            <div className="timeline-visual">
              {edlClips.map((clip, index) => (
                <div
                  key={clip.id}
                  className="timeline-clip"
                  style={{ width: `${(clip.duration / totalDuration) * 100}%` }}
                >
                  <span className="clip-label">Scene {index + 1}</span>
                  <span className="clip-duration">{clip.duration}s</span>
                </div>
              ))}
            </div>
            
            {/* Detailed Clip List */}
            <div className="clips-list">
              {edlClips.map((clip, index) => (
                <div key={clip.id} className="clip-card">
                  <div className="clip-header">
                    <h4>
                      Scene {index + 1} - {clip.duration}s
                    </h4>
                    {editingClip === clip.id ? (
                      <div className="duration-edit">
                        <input
                          type="number"
                          value={localDuration}
                          onChange={(e) => setLocalDuration(parseFloat(e.target.value))}
                          min="0.5"
                          step="0.5"
                          className="duration-input"
                        />
                        <button
                          className="save-btn"
                          onClick={() => handleSaveClipEdit(clip.id)}
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="edit-btn"
                        onClick={() => handleEditClip(clip.id, clip.duration)}
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="clip-transitions">
                    <h5>Transitions:</h5>
                    {clip.transitions.map(trans => (
                      <div key={trans.id} className="transition-tag">
                        <span className={`layer-badge layer-${trans.layer}`}>
                          {trans.layer}
                        </span>
                        <span>{trans.type}</span>
                        <span className="transition-desc">{trans.description}</span>
                      </div>
                    ))}
                  </div>
                  
                  {clip.typography && (
                    <div className="clip-typography">
                      <Type size={16} />
                      <span>"{clip.typography.text}"</span>
                      <span>at {clip.typography.position.x}, {clip.typography.position.y}</span>
                    </div>
                  )}
                  
                  {clip.focalPoint && (
                    <div className="clip-focal">
                      <span>Focal Point: ({clip.focalPoint.x}, {clip.focalPoint.y})</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="approve-section">
            <button
              className="action-btn primary"
              onClick={() => {
                approveScript();
                handleProceedToAudio();
              }}
            >
              <Check size={18} />
              Approve & Proceed to Audio
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Wand2 size={64} />
          <h3>No EDL Yet</h3>
          <p>Click "Generate EDL with AI" to create transitions and timing for your groups</p>
        </div>
      )}
      
      {/* Manual Navigation */}
      {edlClips.length > 0 && (
        <div className="tab-actions">
          <button
            className="proceed-btn"
            onClick={handleProceedToAudio}
          >
            Proceed to Audio
          </button>
        </div>
      )}
    </div>
  );
};
