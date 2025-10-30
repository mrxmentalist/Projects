import React, { useEffect, useRef, useState } from 'react';

interface ThumbnailSidebarProps {
    pdfDoc: any;
    currentPage: number;
    onPageChange: (page: number) => void;
    pageOrder: number[];
    setPageOrder: React.Dispatch<React.SetStateAction<number[]>>;
}

export const ThumbnailSidebar: React.FC<ThumbnailSidebarProps> = ({ pdfDoc, currentPage, onPageChange, pageOrder, setPageOrder }) => {
    const thumbnailRefs = useRef<(HTMLCanvasElement | null)[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!pdfDoc) return;
        thumbnailRefs.current = thumbnailRefs.current.slice(0, pdfDoc.numPages);
        renderAllThumbnails();
    }, [pdfDoc, pageOrder]);

    const renderAllThumbnails = async () => {
        for (let i = 0; i < pdfDoc.numPages; i++) {
            const pageIndex = i; // 0-based
            const canvas = thumbnailRefs.current[pageIndex];
            if (canvas && !canvas.getAttribute('data-rendered')) {
                 try {
                    const page = await pdfDoc.getPage(pageOrder[pageIndex]);
                    const viewport = page.getViewport({ scale: 0.2 });
                    
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context, viewport }).promise;
                    canvas.setAttribute('data-rendered', 'true');
                } catch (error) {
                    console.error(`Error rendering thumbnail for page ${pageOrder[pageIndex]}:`, error);
                }
            }
        }
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        
        const newOrder = [...pageOrder];
        const draggedPage = newOrder.splice(draggedIndex, 1)[0];
        newOrder.splice(index, 0, draggedPage);
        
        setPageOrder(newOrder);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <aside className="w-48 bg-gray-800 p-2 overflow-y-auto shadow-inner">
            <h3 className="text-lg font-semibold mb-2 px-2">Pages</h3>
            <div className="flex flex-col gap-2">
                {pageOrder.map((pageNumber, index) => (
                    <div
                        key={`${pageNumber}-${index}`}
                        onClick={() => onPageChange(pageNumber)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`p-1 rounded-md cursor-pointer border-2 transition-colors duration-200 ${
                            currentPage === pageNumber ? 'border-indigo-500' : 'border-transparent hover:border-gray-600'
                        } ${draggedIndex === index ? 'opacity-50' : ''}`}
                    >
                        <canvas
                            ref={(el) => (thumbnailRefs.current[index] = el)}
                            className="w-full h-auto rounded-sm shadow-md"
                        />
                        <p className="text-center text-xs mt-1">{pageNumber}</p>
                    </div>
                ))}
            </div>
        </aside>
    );
};
