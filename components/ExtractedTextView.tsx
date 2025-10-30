import React from 'react';
import { CloseIcon } from './icons';

interface AiResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    isLoading: boolean;
}

export const AiResponseModal: React.FC<AiResponseModalProps> = ({ isOpen, onClose, title, content, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col relative max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : (
                        <pre className="text-gray-300 whitespace-pre-wrap font-sans">{content}</pre>
                    )}
                </div>
                <footer className="p-4 bg-gray-800/50 flex justify-end gap-3 rounded-b-xl border-t border-gray-700">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 font-semibold transition-colors">Close</button>
                </footer>
            </div>
        </div>
    );
};
