import React, { useState, useEffect } from 'react';
// Fix: Correct import for icon components.
import { CloseIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from './icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface PasswordPromptModalProps extends ModalProps {
    onSubmit: (password: string) => void;
    error: string;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({ isOpen, onClose, onSubmit, error }) => {
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPassword('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(password);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <LockClosedIcon className="w-6 h-6 text-indigo-400" />
                        <h2 className="text-xl font-semibold">Password Required</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <p className="text-gray-300 mb-4">This PDF is password protected. Please enter the password to unlock it.</p>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-900 text-white rounded-md py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter password"
                            autoFocus
                        />
                        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    </div>
                    <footer className="p-4 bg-gray-800/50 flex justify-end gap-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 font-semibold transition-colors">Cancel</button>
                        <button type="submit" className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 font-semibold transition-colors">Unlock</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};


interface EncryptionOptionsModalProps extends ModalProps {
    onSave: (password?: string) => void;
}

export const EncryptionOptionsModal: React.FC<EncryptionOptionsModalProps> = ({ isOpen, onClose, onSave }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setConfirmPassword('');
            setError('');
            setShowPassword(false);
        }
    }, [isOpen]);

    const handleSaveWithPassword = () => {
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!password) {
            setError('Password cannot be empty.');
            return;
        }
        onSave(password);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                     <div className="flex items-center gap-3">
                        <LockClosedIcon className="w-6 h-6 text-indigo-400" />
                        <h2 className="text-xl font-semibold">Encryption Options</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-6 space-y-4">
                    <p className="text-gray-300">Optionally, you can encrypt your PDF with a password.</p>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-900 text-white rounded-md py-2 px-3 pr-10 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter password"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">
                            {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>
                     <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-gray-900 text-white rounded-md py-2 px-3 pr-10 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Confirm password"
                        />
                     </div>
                     {error && <p className="text-red-400 text-sm">{error}</p>}
                </div>
                <footer className="p-4 bg-gray-800/50 flex justify-between gap-3 rounded-b-xl">
                    <button type="button" onClick={() => onSave()} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 font-semibold transition-colors">Save without Password</button>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-md hover:bg-gray-700 font-semibold transition-colors">Cancel</button>
                        <button type="button" onClick={handleSaveWithPassword} className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 font-semibold transition-colors">Encrypt & Save</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
