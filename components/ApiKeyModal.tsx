import React from 'react';
import { CloseIcon } from './icons';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold">API Key Information</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-6">
                    <p className="text-gray-300">
                        This application is configured to use a Gemini API key from a secure environment variable (`process.env.API_KEY`).
                    </p>
                    <p className="text-gray-300 mt-4">
                        There is no need to enter an API key manually.
                    </p>
                </div>
                 <footer className="p-4 bg-gray-800/50 flex justify-end gap-3 rounded-b-xl">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 font-semibold transition-colors">
                        OK
                    </button>
                </footer>
            </div>
        </div>
    );
};
