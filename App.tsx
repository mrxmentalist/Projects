import React, { useState, useRef } from 'react';

import { Toolbar } from './components/Toolbar';
import { ThumbnailSidebar } from './components/ThumbnailSidebar';
import { PdfViewer } from './components/PdfViewer';
import { PasswordPromptModal, EncryptionOptionsModal } from './components/SecurityModals';
import { AiResponseModal } from './components/ExtractedTextView';
import { queryDocument } from './services/geminiService';
import { applyEditsAndReorder } from './services/pdfModificationService';

// Add type declaration for pdfjs-dist loaded from CDN
declare global {
    interface Window {
        'pdfjs-dist/build/pdf': any;
    }
}

// Type definitions exported for use in other components
export type Tool = 'text' | 'redact' | 'image';

interface BaseEdit {
    id: string;
    pageIndex: number; // 0-based index of the original page
    type: Tool;
    x: number;
    y: number;
}
export interface TextEdit extends BaseEdit {
    type: 'text';
    text: string;
    fontSize: number;
    color: string;
    isEditing: boolean;
}
export interface RedactEdit extends BaseEdit {
    type: 'redact';
    width: number;
    height: number;
}
export interface ImageEdit extends BaseEdit {
    type: 'image';
    file: File;
    width: number;
    height: number;
}
export type Edit = TextEdit | RedactEdit | ImageEdit;

function App() {
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageOrder, setPageOrder] = useState<number[]>([]);
    const [zoom, setZoom] = useState<number>(1.5);
    const [edits, setEdits] = useState<Edit[]>([]);
    const [tool, setTool] = useState<Tool>('text');
    const [editMode, setEditMode] = useState<boolean>(false);

    // Modal states
    const [passwordError, setPasswordError] = useState('');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isEncryptionModalOpen, setIsEncryptionModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    
    // AI state
    const [aiResponse, setAiResponse] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    
    const [pdfLoadTask, setPdfLoadTask] = useState<any>(null);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const cleanup = () => {
        setPdfDoc(null);
        setPdfFile(null);
        setCurrentPage(1);
        setPageOrder([]);
        setEdits([]);
        setEditMode(false);
        if (pdfLoadTask) {
            pdfLoadTask.destroy();
            setPdfLoadTask(null);
        }
    }
    
    const loadPdf = async (file: File, password?: string) => {
        const { getDocument } = window['pdfjs-dist/build/pdf'];
        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
            const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
            const task = getDocument({ data: typedarray, password });
            setPdfLoadTask(task);
            try {
                const doc = await task.promise;
                setPdfDoc(doc);
                setPdfFile(file);
                const initialOrder = Array.from({ length: doc.numPages }, (_, i) => i + 1);
                setPageOrder(initialOrder);
                setCurrentPage(1);
                setEdits([]);
                setIsPasswordModalOpen(false);
                setPasswordError('');
            } catch (error: any) {
                if (error.name === 'PasswordException') {
                    setPasswordError('Incorrect password. Please try again.');
                    setIsPasswordModalOpen(true);
                } else {
                    console.error('Error loading PDF:', error);
                    alert('Failed to load PDF. It might be corrupted or an invalid file.');
                    cleanup();
                }
            }
        };
        fileReader.readAsArrayBuffer(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            cleanup();
            loadPdf(file);
        }
        e.target.value = ''; // Reset file input
    };

    const handlePasswordSubmit = (password: string) => {
        if (!pdfFile) return;
        setPasswordError('');
        loadPdf(pdfFile, password);
    };

    const addEdit = (newEdit: Omit<Edit, 'id' | 'pageIndex'>) => {
        const editWithId: Edit = {
            ...newEdit,
            id: crypto.randomUUID(),
            pageIndex: currentPage - 1, // Store against original page index
        } as Edit;

        // If it's a new text edit, make sure other text edits are not in editing mode
        if (editWithId.type === 'text') {
             setEdits(prevEdits => {
                const updatedEdits = prevEdits.map(e =>
                    e.type === 'text' ? { ...e, isEditing: false } : e
                );
                return [...updatedEdits, editWithId];
             });
        } else {
            setEdits(prev => [...prev, editWithId]);
        }
    };
    
    const updateEditText = (id: string, text: string) => {
        setEdits(prevEdits => prevEdits.map(edit => {
            if (edit.id === id && edit.type === 'text') {
                return { ...edit, text, isEditing: false };
            }
            return edit;
        }));
    };
    
    const handleSave = async (password?: string) => {
        setIsEncryptionModalOpen(false);
        if (!pdfFile) return;

        const originalPdfBytes = new Uint8Array(await pdfFile.arrayBuffer());
        try {
            const modifiedPdfBytes = await applyEditsAndReorder(originalPdfBytes, edits, pageOrder, password);
            const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `edited-${pdfFile.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to save PDF:", error);
            alert("An error occurred while saving the PDF.");
        }
    };

    const handleExtractText = async () => {
        if (!pdfDoc) {
            alert("Please load a PDF first.");
            return;
        }
        
        const userQuery = prompt("What would you like to know about this document?");
        if (!userQuery) return;

        setIsAiModalOpen(true);
        setIsAiLoading(true);
        setAiResponse('');

        let fullText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            try {
                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n\n';
            } catch (pageError) {
                console.error(`Error getting text from page ${i}:`, pageError);
            }
        }
        
        const response = await queryDocument(fullText, userQuery);
        setAiResponse(response);
        setIsAiLoading(false);
    };
    
    // Edits for the currently selected page (which is identified by `currentPage`)
    const currentPageEdits = edits.filter(edit => edit.pageIndex === currentPage - 1);

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
            <Toolbar 
                onFileChange={handleFileChange}
                onZoomIn={() => setZoom(z => Math.min(z + 0.1, 3))}
                onZoomOut={() => setZoom(z => Math.max(z - 0.1, 0.2))}
                zoom={zoom}
                setTool={setTool}
                activeTool={tool}
                onExtractText={handleExtractText}
                onSave={() => setIsEncryptionModalOpen(true)}
                editMode={editMode}
                setEditMode={(enabled) => {
                    if (!pdfDoc) return; // Can't enable edit mode without a doc
                    setEditMode(enabled);
                    // Deactivate any active text editing when toggling edit mode
                    if (!enabled) {
                        setEdits(prev => prev.map(e => e.type === 'text' ? {...e, isEditing: false} : e));
                    }
                }}
            />
            <main className="flex-grow flex overflow-hidden">
                {pdfDoc && (
                    <ThumbnailSidebar 
                        pdfDoc={pdfDoc}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        pageOrder={pageOrder}
                        setPageOrder={setPageOrder}
                    />
                )}
                <div className="flex-grow overflow-auto">
                    {pdfDoc ? (
                         <PdfViewer 
                            pdfDoc={pdfDoc}
                            pageNumber={currentPage} // Render the page selected in the sidebar
                            zoom={zoom}
                            canvasRef={canvasRef}
                            edits={currentPageEdits}
                            tool={tool}
                            addEdit={addEdit}
                            updateEditText={updateEditText}
                            editMode={editMode}
                        />
                    ) : (
                        <div className="flex justify-center items-center h-full text-gray-500">
                            <p className="text-2xl">Open a PDF to start editing</p>
                        </div>
                    )}
                </div>
            </main>
            <PasswordPromptModal 
                isOpen={isPasswordModalOpen} 
                onClose={() => {
                    setIsPasswordModalOpen(false);
                    cleanup();
                }}
                onSubmit={handlePasswordSubmit}
                error={passwordError}
            />
            <EncryptionOptionsModal 
                isOpen={isEncryptionModalOpen}
                onClose={() => setIsEncryptionModalOpen(false)}
                onSave={handleSave}
            />
            <AiResponseModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                title="AI Assistant"
                content={aiResponse}
                isLoading={isAiLoading}
            />
        </div>
    );
}

export default App;
