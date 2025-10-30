// components/menu/CreateClubModal.tsx
"use client";

import React, { useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { X, Music, Building2, Users, Sparkles } from 'lucide-react';

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClub: (clubData: {
    name: string;
    type: string;
    description: string;
    icon: string;
  }) => void;
}

const clubTypes = [
  { value: 'recording', label: 'Recording Studio', icon: '🎙️' },
  { value: 'production', label: 'Production House', icon: '🎛️' },
  { value: 'vocal', label: 'Vocal Studio', icon: '🎤' },
  { value: 'mixing', label: 'Mixing Studio', icon: '🎚️' },
  { value: 'mastering', label: 'Mastering Studio', icon: '✨' },
  { value: 'creative', label: 'Creative Space', icon: '🎨' },
];

const clubIcons = ['🎵', '🎸', '🎹', '🎧', '🎼', '🎺', '🎷', '🥁', '🎻', '🎤'];

export const CreateClubModal: React.FC<CreateClubModalProps> = ({
  isOpen,
  onClose,
  onCreateClub,
}) => {
  const { theme } = useTheme();
  const [clubName, setClubName] = useState('');
  const [clubType, setClubType] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎵');

  if (!isOpen) return null;

  const handleClose = () => {
    setClubName('');
    setClubType('');
    setClubDescription('');
    setSelectedIcon('🎵');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clubName.trim() && clubType) {
      onCreateClub({
        name: clubName,
        type: clubType,
        description: clubDescription,
        icon: selectedIcon,
      });
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`
        relative max-w-lg w-full rounded-2xl border shadow-2xl
        ${theme === 'dark' 
          ? 'bg-gray-900 border-gray-800' 
          : 'bg-white border-gray-200'
        }
      `}>
        {/* Header */}
        <div className={`
          p-6 border-b
          ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Create New Club
                </h2>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Start your creative space
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`
                p-2 rounded-lg transition-all
                ${theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Club Icon Selection */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Choose Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {clubIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all
                    ${selectedIcon === icon
                      ? theme === 'dark'
                        ? 'bg-purple-500/20 border-2 border-purple-500 scale-110'
                        : 'bg-purple-50 border-2 border-purple-500 scale-110'
                      : theme === 'dark'
                        ? 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
                        : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Club Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Club Name *
            </label>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              className={`
                w-full px-4 py-3 rounded-xl border transition-all
                focus:outline-none focus:ring-2 focus:ring-purple-500
                ${theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                }
              `}
              placeholder="e.g., Studio Alpha"
              required
              autoFocus
            />
          </div>

          {/* Club Type */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Club Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {clubTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setClubType(type.label)}
                  className={`
                    p-3 rounded-xl border transition-all text-left
                    ${clubType === type.label
                      ? theme === 'dark'
                        ? 'bg-purple-500/10 border-purple-500 text-white'
                        : 'bg-purple-50 border-purple-500 text-gray-900'
                      : theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Description (Optional)
            </label>
            <textarea
              value={clubDescription}
              onChange={(e) => setClubDescription(e.target.value)}
              className={`
                w-full px-4 py-3 rounded-xl border transition-all resize-none
                focus:outline-none focus:ring-2 focus:ring-purple-500
                ${theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                }
              `}
              rows={3}
              placeholder="What makes your club special?"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className={`
                flex-1 px-4 py-3 rounded-xl font-medium border transition-all
                ${theme === 'dark' 
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!clubName.trim() || !clubType}
              className={`
                flex-1 px-4 py-3 rounded-xl font-semibold transition-all
                bg-gradient-to-r from-purple-500 to-pink-600 text-white
                hover:from-purple-600 hover:to-pink-700
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-95
              `}
            >
              Create Club
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};