import { useEditorStore } from '@/store';
import React, { useState, useEffect, useCallback } from 'react';

const EditPropertiesInlineEditor = () => {
  const { canvas, markAsModified } = useEditorStore();
  const [position, setPosition] = useState({ x: 0, y: 0, visible: false });

  const updatePosition = useCallback(() => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    
    if (activeObject) {
      // Get object's bounding rect
      const boundingRect = activeObject.getBoundingRect();
      
      // Get canvas offset position
      const canvasElement = canvas.getElement();
      const canvasRect = canvasElement.getBoundingClientRect();
      
      // Calculate position for top-right corner, above the object
      const x = canvasRect.left + boundingRect.left + boundingRect.width;
      const y = canvasRect.top + boundingRect.top - 110; // 110 to account for div height + margin
      
      setPosition({
        x: Math.max(0, x),
        y: Math.max(0, y),
        visible: true
      });
    } else {
      setPosition(prev => ({ ...prev, visible: false }));
    }
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;

    const handleSelectionCreated = () => updatePosition();
    const handleSelectionUpdated = () => updatePosition();
    const handleSelectionCleared = () => setPosition(prev => ({ ...prev, visible: false }));
    const handleObjectMoving = () => updatePosition();
    const handleObjectScaling = () => updatePosition();
    const handleObjectRotating = () => updatePosition();

    // Add event listeners
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionUpdated);
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('object:moving', handleObjectMoving);
    canvas.on('object:scaling', handleObjectScaling);
    canvas.on('object:rotating', handleObjectRotating);

    // Initial position update
    updatePosition();

    // Cleanup
    return () => {
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionUpdated);
      canvas.off('selection:cleared', handleSelectionCleared);
      canvas.off('object:moving', handleObjectMoving);
      canvas.off('object:scaling', handleObjectScaling);
      canvas.off('object:rotating', handleObjectRotating);
    };
  }, [canvas, updatePosition]);

  if (!position.visible) return null;

  return (
    <div
      className="fixed transition-[] z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '500px',
        height: '100px',
        pointerEvents: 'auto',
        transition: 'left 0.2s ease-out, top 0.2s ease-out'
      }}
    >
      <div className="flex items-center justify-between h-full">
        <div className="text-gray-700">
          <h3 className="font-semibold text-sm">Object Properties</h3>
          <p className="text-xs text-gray-500">Inline editor for selected object</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
            Edit
          </button>
          <button className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPropertiesInlineEditor;