import React from 'react';
import { useProjectStore } from '../../store/useStore';
import { Play, Settings, AlertTriangle, CheckCircle, Download, Monitor } from 'lucide-react';
import { renderTestVideo } from '../../utils/ffmpegRender';
import './PreviewTab.css';

export const PreviewTab: React.FC = () => {
  const { 
    previewResolution,
    previewFrameRate,
    previewCodec,
    isPreviewReady,
    validationErrors,
    mediaFiles,
    generatePreview,
    setPreviewSettings,
    validateProject,
    isLoading
  } = useProjectStore();
  
  const [showValidation, setShowValidation] = React.useState(false);
  const [isTestRendering, setIsTestRendering] = React.useState(false);
  const [testRenderError, setTestRenderError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    // Auto-generate preview on tab entry
    generatePreview();
  }, []);
  
  const handleValidate = () => {
    const errors = validateProject();
    setShowValidation(true);
    return errors.length === 0;
  };
  
  const handleExport = () => {
    console.log('Starting export with settings:', {
      resolution: previewResolution,
      frameRate: previewFrameRate,
      codec: previewCodec,
    });
  };
  
  const handleTestRender = async () => {
    setTestRenderError(null);
    setIsTestRendering(true);
    
    try {
      // Get media files from store
      const state = useProjectStore.getState();
      await renderTestVideo(state.mediaFiles);
      console.log('Test render completed successfully');
    } catch (error: any) {
      console.error('Test render failed:', error);
      setTestRenderError(error.message || 'Test render failed. Please check console for details.');
    } finally {
      setIsTestRendering(false);
    }
  };
  
  const resolutions = ['720p', '1080p', '4K'] as const;
  const frameRates = [24, 30, 60] as const;
  const codecs = ['h264', 'h265'] as const;
  
  return (
    <div className="preview-tab">
      <div className="tab-header">
        <h1>Preview & Export</h1>
        <p className="tab-description">Review the complete composition and configure export settings</p>
      </div>
      
      {/* Validation Status */}
      <div className="validation-section">
        <button
          className={`validation-btn ${validationErrors.length === 0 ? 'success' : 'warning'}`}
          onClick={handleValidate}
        >
          {validationErrors.length === 0 ? (
            <>
              <CheckCircle size={20} />
              <span>Project Validated</span>
            </>
          ) : (
            <>
              <AlertTriangle size={20} />
              <span>{validationErrors.length} Issues Found</span>
            </>
          )}
        </button>
        
        {showValidation && validationErrors.length > 0 && (
          <div className="validation-errors">
            {validationErrors.map((error, index) => (
              <div key={index} className="error-item">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Preview Player */}
      <section className="preview-section">
        <div className="section-header">
          <h2>
            <Monitor size={20} />
            Preview Player
          </h2>
          <button className="action-btn primary">
            <Play size={18} />
            Play Preview
          </button>
        </div>
        
        <div className="preview-player">
          {isLoading ? (
            <div className="preview-loading">
              <div className="spinner"></div>
              <p>Generating preview...</p>
            </div>
          ) : isPreviewReady ? (
            <div className="preview-content">
              <div className="preview-placeholder">
                <Play size={64} />
                <p>Preview Ready - Click play to review</p>
              </div>
              <div className="timeline-scrubber">
                <input type="range" min="0" max="100" defaultValue="0" />
                <div className="time-display">
                  <span>0:00</span>
                  <span>0:30</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="preview-error">
              <AlertTriangle size={48} />
              <p>Preview generation failed</p>
              <button onClick={() => generatePreview()}>Retry</button>
            </div>
          )}
        </div>
      </section>
      
      {/* Export Settings */}
      <section className="settings-section">
        <div className="section-header">
          <h2>
            <Settings size={20} />
            Export Settings
          </h2>
        </div>
        
        <div className="settings-grid">
          <div className="setting-group">
            <label>Resolution</label>
            <select
              value={previewResolution}
              onChange={(e) => setPreviewSettings({ previewResolution: e.target.value as any })}
            >
              {resolutions.map(res => (
                <option key={res} value={res}>{res}</option>
              ))}
            </select>
          </div>
          
          <div className="setting-group">
            <label>Frame Rate</label>
            <select
              value={previewFrameRate}
              onChange={(e) => setPreviewSettings({ previewFrameRate: parseInt(e.target.value) as any })}
            >
              {frameRates.map(fps => (
                <option key={fps} value={fps}>{fps} FPS</option>
              ))}
            </select>
          </div>
          
          <div className="setting-group">
            <label>Codec</label>
            <select
              value={previewCodec}
              onChange={(e) => setPreviewSettings({ previewCodec: e.target.value as any })}
            >
              {codecs.map(codec => (
                <option key={codec} value={codec}>
                  {codec === 'h264' ? 'H.264 (Compatible)' : 'H.265 (Efficient)'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="setting-group">
            <label>Quality</label>
            <select defaultValue="high">
              <option value="low">Low (Smaller file)</option>
              <option value="medium">Medium</option>
              <option value="high">High (Best quality)</option>
            </select>
          </div>
        </div>
        
        <div className="export-info">
          <p><strong>Recommended:</strong> {previewResolution} at {previewFrameRate} FPS with H.264 for social media compatibility</p>
        </div>
      </section>
      
      {/* System Resources */}
      <section className="resources-section">
        <div className="section-header">
          <h2>System Resources</h2>
        </div>
        
        <div className="resource-monitors">
          <div className="resource-bar">
            <div className="resource-label">
              <span>GPU VRAM</span>
              <span>4.2 / 8 GB</span>
            </div>
            <div className="resource-fill" style={{ width: '52%' }}></div>
          </div>
          
          <div className="resource-bar">
            <div className="resource-label">
              <span>Memory</span>
              <span>6.8 / 16 GB</span>
            </div>
            <div className="resource-fill" style={{ width: '42%' }}></div>
          </div>
          
          <div className="resource-bar">
            <div className="resource-label">
              <span>CPU</span>
              <span>28%</span>
            </div>
            <div className="resource-fill" style={{ width: '28%' }}></div>
          </div>
        </div>
      </section>
      
      {/* Export Actions */}
      <div className="export-actions">
        <button
          className="action-btn secondary"
          onClick={handleTestRender}
          disabled={isTestRendering || mediaFiles.length === 0}
        >
          {isTestRendering ? 'Rendering...' : 'Test Render (3s)'}
        </button>
        
        {testRenderError && (
          <div className="test-render-error" style={{ 
            padding: '0.75rem', 
            background: 'var(--error)', 
            borderRadius: '6px',
            color: '#fff',
            fontSize: '0.9rem'
          }}>
            {testRenderError}
          </div>
        )}
        
        <button
          className="action-btn primary large"
          onClick={handleExport}
          disabled={validationErrors.length > 0 || isLoading}
        >
          <Download size={20} />
          Start Final Export
        </button>
      </div>
      
      {validationErrors.length > 0 && (
        <p className="export-warning">
          Please resolve validation errors before exporting
        </p>
      )}
      
      {mediaFiles.length === 0 && (
        <p className="export-warning" style={{ marginTop: '0.5rem' }}>
          ⚠️ Upload images to the Catalog before testing render
        </p>
      )}
    </div>
  );
};
