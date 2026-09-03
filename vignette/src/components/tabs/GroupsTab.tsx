import React from 'react';
import { useProjectStore } from '../../store/useStore';
import { Sparkles, GripVertical, Plus, Split, Merge, Check } from 'lucide-react';
import './GroupsTab.css';

export const GroupsTab: React.FC = () => {
  const { 
    groups, 
    mediaFiles, 
    visualStylePreset,
    generateGroups,
    updateGroup,
    mergeGroups,
    splitGroup,
    setVisualStylePreset,
    setCurrentTab,
    isLoading,
    executionMode
  } = useProjectStore();
  
  const images = mediaFiles.filter(f => f.type === 'image');
  const getImageById = (id: string) => images.find(img => img.id === id);
  
  const handleRegroup = async () => {
    await generateGroups();
  };
  
  const handleProceedToScript = () => {
    if (groups.length > 0) {
      setCurrentTab('script');
    }
  };
  
  const stylePresets = [
    { id: 'default', name: 'Default' },
    { id: 'cinematic', name: 'Cinematic' },
    { id: 'vibrant', name: 'Vibrant' },
    { id: 'moody', name: 'Moody' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'retro', name: 'Retro' },
  ];
  
  return (
    <div className="groups-tab">
      <div className="tab-header">
        <h1>Groups</h1>
        <p className="tab-description">Organize imported media into narrative clusters and micro-stories</p>
      </div>
      
      {/* Visual Style Presets */}
      <div className="style-presets-section">
        <label>Visual Style Preset:</label>
        <div className="preset-buttons">
          {stylePresets.map(preset => (
            <button
              key={preset.id}
              className={visualStylePreset === preset.id ? 'active' : ''}
              onClick={() => setVisualStylePreset(preset.id)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* AI Actions */}
      <div className="ai-actions">
        <button
          className="action-btn secondary"
          onClick={handleRegroup}
          disabled={images.length === 0 || isLoading}
        >
          <Sparkles size={18} />
          {isLoading ? 'Analyzing...' : 'Regroup with AI'}
        </button>
        
        {executionMode === 'step-by-step' && groups.length > 0 && (
          <div className="approval-notice">
            <Check size={20} />
            <span>AI grouping complete. Review and adjust below, then proceed.</span>
          </div>
        )}
      </div>
      
      {/* Groups Grid */}
      {groups.length > 0 ? (
        <div className="groups-container">
          {groups.map((group, index) => (
            <div key={group.id} className="group-card">
              <div className="group-header">
                <div className="group-title">
                  <GripVertical size={20} />
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                    className="group-name-input"
                  />
                </div>
                <div className="group-meta">
                  <span>{group.imageIds.length} images</span>
                  {group.hookImageId && (
                    <span className="hook-badge">Hook Image</span>
                  )}
                </div>
              </div>
              
              <div className="group-images">
                {group.imageIds.map((imageId, imgIndex) => {
                  const image = getImageById(imageId);
                  if (!image) return null;
                  
                  return (
                    <div
                      key={imageId}
                      className={`group-image ${imgIndex === 0 ? 'hook' : ''}`}
                      title={imgIndex === 0 ? 'Opening hook image' : ''}
                    >
                      {image.proxyUrl && (
                        <img src={image.proxyUrl} alt={image.name} />
                      )}
                      {imgIndex === 0 && (
                        <div className="hook-indicator">3s Hook</div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="group-actions">
                <button
                  className="action-btn small"
                  onClick={() => {
                    // In a real app, this would open a modal to select images to split
                    console.log('Split group:', group.id);
                  }}
                  title="Split group"
                >
                  <Split size={16} />
                  Split
                </button>
                <button
                  className="action-btn small"
                  onClick={() => {
                    // In a real app, this would allow selecting another group to merge
                    console.log('Merge group:', group.id);
                  }}
                  title="Merge with another group"
                  disabled={groups.length <= 1}
                >
                  <Merge size={16} />
                  Merge
                </button>
                <button
                  className="action-btn small"
                  onClick={() => {
                    // Remove group and return images to ungrouped
                    console.log('Remove group:', group.id);
                  }}
                  title="Remove group"
                >
                  <Plus size={16} className="rotate-45" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Sparkles size={64} />
          <h3>No Groups Yet</h3>
          <p>Click "Regroup with AI" to automatically organize your images into narrative clusters</p>
          <button
            className="action-btn primary"
            onClick={handleRegroup}
            disabled={images.length === 0 || isLoading}
          >
            <Sparkles size={18} />
            Generate Groups
          </button>
        </div>
      )}
      
      {/* Info Panel */}
      {groups.length > 0 && (
        <div className="info-panel">
          <h4>AI Optimization Notes</h4>
          <ul>
            <li>First image in each group selected as 3-second hook</li>
            <li>Groups optimized for social media engagement</li>
            <li>Images clustered by visual similarity and narrative flow</li>
          </ul>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="tab-actions">
        <button
          className="proceed-btn"
          onClick={handleProceedToScript}
          disabled={groups.length === 0 || isLoading}
        >
          {isLoading ? 'Processing...' : `Proceed to Script (${groups.length} groups)`}
        </button>
      </div>
    </div>
  );
};
