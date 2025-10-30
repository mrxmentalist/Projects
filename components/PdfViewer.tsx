import React, { useEffect, RefObject, useRef, useState, useLayoutEffect } from 'react';
// Fix: Correct import path for types from the main App component.
import { Edit, Tool, TextEdit } from '../App';

interface PdfViewerProps {
    pdfDoc: any;
    pageNumber: number;
    zoom: number;
    canvasRef: RefObject<HTMLCanvasElement>;
    edits: Edit[];
    tool: Tool;
    addEdit: (edit: Omit<Edit, 'id' | 'pageIndex'>) => void;
    updateEditText: (id: string, text: string) => void;
    editMode: boolean;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ pdfDoc, pageNumber, zoom, canvasRef, edits, tool, addEdit, updateEditText, editMode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

    const getCursor = () => {
        if (!editMode) return 'default';
        switch (tool) {
            case 'text': return 'text';
            case 'redact': return 'crosshair';
            case 'image': return 'copy';
            default: return 'default';
        }
    };

    const renderPage = async (pageNumberToRender: number) => {
        if (!pdfDoc || !canvasRef.current || !pageNumberToRender) return;
        try {
            const page = await pdfDoc.getPage(pageNumberToRender);
            const viewport = page.getViewport({ scale: zoom });
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext('2d');
            if (!context) return;
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            setPageDimensions({ width: viewport.width, height: viewport.height });

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            await page.render(renderContext).promise;
            
            // Re-render edits on top
            renderEdits(context, edits);

        } catch (error) {
            console.error('Error rendering PDF page:', error);
        }
    };
    
    const renderEdits = (ctx: CanvasRenderingContext2D, editsToRender: Edit[]) => {
        editsToRender.forEach(edit => {
            if (edit.type === 'redact') {
                ctx.fillStyle = '#000';
                ctx.fillRect(edit.x, edit.y, edit.width, edit.height);
            } else if (edit.type === 'text' && !edit.isEditing) {
                ctx.fillStyle = edit.color;
                ctx.font = `${edit.fontSize * zoom}px sans-serif`;
                ctx.fillText(edit.text, edit.x, edit.y + (edit.fontSize * zoom * 0.8));
            } else if (edit.type === 'image') {
                const img = new Image();
                img.onload = () => {
                   ctx.drawImage(img, edit.x, edit.y, edit.width, edit.height);
                }
                img.src = URL.createObjectURL(edit.file);
            }
        });
    };

    useEffect(() => {
        renderPage(pageNumber);
    }, [pdfDoc, pageNumber, zoom, edits]); // Rerender when page, zoom or edits change.
    
    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!editMode) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (tool === 'text') {
            addEdit({
                type: 'text',
                x,
                y,
                text: 'New Text',
                fontSize: 16 / zoom,
                color: '#000000',
                isEditing: true
            });
        } else if (tool === 'image') {
            imageInputRef.current?.setAttribute('data-x', x.toString());
            imageInputRef.current?.setAttribute('data-y', y.toString());
            imageInputRef.current?.click();
        } else if (tool === 'redact') {
            addEdit({ type: 'redact', x: x - 25, y: y - 10, width: 50, height: 20 });
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const x = parseFloat(imageInputRef.current?.getAttribute('data-x') || '0');
        const y = parseFloat(imageInputRef.current?.getAttribute('data-y') || '0');
        
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
             const img = new Image();
             img.onload = () => {
                const aspectRatio = img.width / img.height;
                const newWidth = 100;
                const newHeight = 100 / aspectRatio;
                addEdit({ type: 'image', x, y, width: newWidth, height: newHeight, file });
             };
             img.src = URL.createObjectURL(file);
        }
        e.target.value = ''; // Reset input
    };

    const handleTextUpdate = (edit: TextEdit, newText: string) => {
        updateEditText(edit.id, newText);
    };

    return (
        <div ref={containerRef} className="flex justify-center items-start p-4 relative" onClick={handleCanvasClick} style={{ cursor: getCursor() }}>
            <canvas ref={canvasRef} className="rounded-lg shadow-2xl"></canvas>
            {editMode && edits.filter(e => e.type === 'text' && e.isEditing).map((edit) => {
                const textEdit = edit as TextEdit;
                return (
                 <textarea
                    key={textEdit.id}
                    defaultValue={textEdit.text}
                    onBlur={(e) => handleTextUpdate(textEdit, e.target.value)}
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    style={{
                        position: 'absolute',
                        left: textEdit.x + (containerRef.current?.offsetLeft || 0),
                        top: textEdit.y + (containerRef.current?.offsetTop || 0),
                        fontSize: `${textEdit.fontSize * zoom}px`,
                        lineHeight: 1,
                        background: 'rgba(255, 255, 255, 0.9)',
                        color: 'black',
                        border: '1px dashed gray',
                        outline: 'none',
                        resize: 'none',
                        zIndex: 10,
                        width: `${textEdit.text.length + 5}ch`,
                        height: `${(textEdit.fontSize * zoom) * 1.5}px`
                    }}
                    className="p-0 m-0"
                 />
                )
            })}
            <input type="file" ref={imageInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleImageUpload} />
        </div>
    );
};
