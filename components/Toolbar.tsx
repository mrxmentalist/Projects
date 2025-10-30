import React, { RefObject } from 'react';
import { Tool } from '../App';

interface ToolbarProps {
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    zoom: number;
    setTool: (tool: Tool) => void;
    activeTool: Tool;
    onExtractText: () => void;
    onSave: () => void;
    editMode: boolean;
    setEditMode: (enabled: boolean) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    onFileChange,
    onZoomIn,
    onZoomOut,
    zoom,
    setTool,
    activeTool,
    onExtractText,
    onSave,
    editMode,
    setEditMode
}) => {
    const fileInputRef: RefObject<HTMLInputElement> = React.createRef();

    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
    };

    const ToolButton = ({ tool, label }: { tool: Tool, label: string }) => (
        <button
            onClick={() => setTool(tool)}
            disabled={!editMode}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTool === tool && editMode ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
        >
            {label}
        </button>
    );

    return (
        <header className="bg-gray-800 text-white p-2 flex items-center justify-between shadow-md z-10 sticky top-0">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold">PDF Editor</h1>
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={onFileChange}
                    className="hidden"
                    ref={fileInputRef}
                />
                <button
                    onClick={handleFileButtonClick}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Open PDF
                </button>
            </div>

            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <button onClick={onZoomOut} className="px-3 py-2 bg-gray-700 rounded-md hover:bg-gray-600">-</button>
                    <span>{Math.round(zoom * 100)}%</span>
                    <button onClick={onZoomIn} className="px-3 py-2 bg-gray-700 rounded-md hover:bg-gray-600">+</button>
                </div>

                <div className="h-8 border-l border-gray-600"></div>

                <div className="flex items-center gap-2">
                     <label className="flex items-center cursor-pointer">
                        <span className="mr-2 text-sm font-medium">Edit Mode</span>
                        <div className="relative">
                            <input type="checkbox" checked={editMode} onChange={(e) => setEditMode(e.target.checked)} className="sr-only" />
                            <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${editMode ? 'transform translate-x-6 bg-indigo-400' : ''}`}></div>
                        </div>
                    </label>
                </div>
                
                <div className="h-8 border-l border-gray-600"></div>
                
                <div className="flex items-center gap-2">
                    <ToolButton tool="text" label="Text" />
                    <ToolButton tool="redact" label="Redact" />
                    <ToolButton tool="image" label="Image" />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onExtractText}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Ask AI
                </button>
                <button
                    onClick={onSave}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Save & Download
                </button>
            </div>
        </header>
    );
};
