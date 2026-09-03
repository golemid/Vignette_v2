import React, { useState } from 'react';
import { useProjectStore } from '../../store/useStore';
import { Sparkles, GripVertical, Plus, Split, Merge, Check } from 'lucide-react';
import type {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './GroupsTab.css';

interface SortableImageProps {
  imageId: string;
  groupId: string;
  isHook: boolean;
  imageUrl?: string;
  imageName: string;
}

const SortableImage: React.FC<SortableImageProps> = ({ imageId, groupId, isHook, imageUrl, imageName }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: imageId, data: { groupId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group-image ${isHook ? 'hook' : ''} ${isDragging ? 'dragging' : ''}`}
      title={isHook ? 'Opening hook image' : ''}
    >
      {imageUrl && (
        <img src={imageUrl} alt={imageName} draggable={false} />
      )}
      {isHook && (
        <div className="hook-indicator">3s Hook</div>
      )}
      <div className="image-overlay">
        <GripVertical size={16} />
      </div>
    </div>
  );
};

export const GroupsTab: React.FC = () => {
  const { 
    groups, 
    mediaFiles, 
    visualStylePreset,
    generateGroups,
    updateGroup,
    setVisualStylePreset,
    setCurrentTab,
    isLoading,
    executionMode
  } = useProjectStore();
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedImage, setDraggedImage] = useState<{ id: string; fromGroupId: string } | null>(null);
  
  const images = mediaFiles.filter(f => f.type === 'image');
  const getImageById = (id: string) => images.find(img => img.id === id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleRegroup = async () => {
    await generateGroups();
  };
  
  const handleProceedToScript = () => {
    if (groups.length > 0) {
      setCurrentTab('script');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Find which group the image belongs to
    for (const group of groups) {
      if (group.imageIds.includes(event.active.id as string)) {
        setDraggedImage({ id: event.active.id as string, fromGroupId: group.id });
        break;
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the source and destination groups
    let sourceGroup = groups.find(g => g.imageIds.includes(activeId));
    let destGroup = groups.find(g => g.imageIds.includes(overId));

    // If dropping on a group container (not an image), overId will be the group ID
    if (!destGroup) {
      destGroup = groups.find(g => g.id === overId);
    }

    if (sourceGroup && destGroup && sourceGroup.id !== destGroup.id) {
      // We're moving between groups - visual feedback only, actual move happens on dragEnd
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      setDraggedImage(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source group
    const sourceGroup = groups.find(g => g.imageIds.includes(activeId));
    if (!sourceGroup) {
      setDraggedImage(null);
      return;
    }

    // Check if dropping on another image
    const overImage = getImageById(overId);
    const destGroup = overImage 
      ? groups.find(g => g.imageIds.includes(overId))
      : groups.find(g => g.id === overId);

    if (!destGroup) {
      setDraggedImage(null);
      return;
    }

    // Same group - reorder within group
    if (sourceGroup.id === destGroup.id) {
      const oldIndex = sourceGroup.imageIds.indexOf(activeId);
      const newIndex = sourceGroup.imageIds.indexOf(overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newImageIds = arrayMove(sourceGroup.imageIds, oldIndex, newIndex);
        updateGroup(sourceGroup.id, { 
          imageIds: newImageIds,
          hookImageId: newImageIds[0], // Update hook if first position changed
        });
      }
    } else {
      // Different group - move image between groups
      const oldIndex = sourceGroup.imageIds.indexOf(activeId);
      if (oldIndex !== -1) {
        // Remove from source
        const newSourceIds = [...sourceGroup.imageIds];
        newSourceIds.splice(oldIndex, 1);

        // Find insert position in destination
        let newIndex = destGroup.imageIds.length;
        if (overImage) {
          newIndex = destGroup.imageIds.indexOf(overId);
          if (newIndex === -1) newIndex = destGroup.imageIds.length;
        }

        const newDestIds = [...destGroup.imageIds];
        newDestIds.splice(newIndex, 0, activeId);

        // Update both groups
        updateGroup(sourceGroup.id, { 
          imageIds: newSourceIds,
          hookImageId: newSourceIds[0],
        });
        updateGroup(destGroup.id, { 
          imageIds: newDestIds,
          hookImageId: newDestIds[0],
        });
      }
    }

    setDraggedImage(null);
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
            {groups.map((group) => (
              <div key={group.id} className="group-card" data-group-id={group.id}>
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
                
                <SortableContext
                  items={group.imageIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="group-images">
                    {group.imageIds.map((imageId, imgIndex) => {
                      const image = getImageById(imageId);
                      if (!image) return null;
                      
                      return (
                        <SortableImage
                          key={imageId}
                          imageId={imageId}
                          groupId={group.id}
                          isHook={imgIndex === 0}
                          imageUrl={image.proxyUrl}
                          imageName={image.name}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
                
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
      
      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && draggedImage ? (
          (() => {
            const image = getImageById(activeId);
            return image ? (
              <div className="group-image dragging-overlay">
                {image.proxyUrl && <img src={image.proxyUrl} alt={image.name} />}
                <GripVertical size={20} />
              </div>
            ) : null;
          })()
        ) : null}
      </DragOverlay>
    </div>
    </DndContext>
  );
};
