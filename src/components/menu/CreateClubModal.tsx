// components/menu/CreateClubModal.tsx
"use client";

import React, { useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { X, Music2, ArrowRight } from 'lucide-react';

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClub: (clubData: {
    name: string;
    type: string;
    description: string;
    icon: string;
    grantsRole: string;
  }) => void;
}

// Club types mapped to roles they grant (using Prisma enum values)
const clubTypes = [
  { value: 'RECORDING', label: 'Recording', icon: '🎙️', grantsRole: 'ARTIST' },       // recording sessions → ARTIST
  { value: 'PRODUCTION', label: 'Production', icon: '🎚️', grantsRole: 'PRODUCER' },      // mixing & mastering → PRODUCER
  { value: 'RENTAL', label: 'Rental', icon: '🏠', grantsRole: 'STUDIO_OWNER' },              // studio space rental → STUDIO_OWNER
  { value: 'MANAGEMENT', label: 'Management', icon: '🧑‍💼', grantsRole: 'OTHER' },    // artist/business management → OTHER
  { value: 'DISTRIBUTION', label: 'Distribution', icon: '📣', grantsRole: 'OTHER' },  // promotion, publicity, reach → OTHER
  { value: 'CREATIVE', label: 'Creative', icon: '🎨', grantsRole: 'LYRICIST' }           // artistic direction → LYRICIST
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
      // Find the selected club type to get the role it grants
      const selectedClubType = clubTypes.find(t => t.value === clubType);
      const grantsRole = selectedClubType?.grantsRole || 'OTHER';

      onCreateClub({
        name: clubName,
        type: clubType,
        description: clubDescription,
        icon: selectedIcon,
        grantsRole,
      });
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`
        relative w-full max-w-sm rounded-xl border
        ${theme === 'dark' 
          ? 'bg-black border-zinc-800' 
          : 'bg-white border-zinc-200'
        }
      `}>
        {/* Header */}
        <div className={`
          p-4 border-b
          ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
                <Music2 className="w-3 h-3 text-black" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className={`text-base font-light tracking-tight ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  Create Club
                </h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`
                p-1 rounded transition-all duration-200
                ${theme === 'dark'
                  ? 'hover:bg-zinc-800 text-zinc-500 hover:text-white'
                  : 'hover:bg-zinc-100 text-zinc-600 hover:text-black'
                }
              `}
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Club Icon Selection */}
          <div className="space-y-1">
            <label className={`block text-xs font-medium tracking-wider uppercase ${
              theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              Icon
            </label>
            <div className="flex flex-wrap gap-1">
              {clubIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`
                    w-8 h-8 rounded flex items-center justify-center text-base transition-all duration-150
                    ${selectedIcon === icon
                      ? theme === 'dark'
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : theme === 'dark'
                        ? 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                        : 'bg-zinc-50 border border-zinc-200 hover:border-zinc-300'
                    }
                  `}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Club Name */}
          <div className="space-y-1">
            <label className={`block text-xs font-medium tracking-wider uppercase ${
              theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              Name *
            </label>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              className={`
                w-full px-3 py-2 text-sm font-light rounded border transition-all duration-200 tracking-wide
                focus:outline-none focus:border-white
                ${theme === 'dark' 
                  ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus:bg-black' 
                  : 'bg-zinc-50 border-zinc-200 text-black placeholder-zinc-500 focus:bg-white'
                }
              `}
              placeholder="Studio Alpha"
              required
              autoFocus
            />
          </div>

          {/* Club Type */}
          <div className="space-y-1">
            <label className={`block text-xs font-medium tracking-wider uppercase ${
              theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              Type *
            </label>
            <div className="grid grid-cols-3 gap-1">
              {clubTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setClubType(type.value)}
                  className={`
                    p-2 rounded border transition-all duration-150 text-center
                    ${clubType === type.value
                      ? theme === 'dark'
                        ? 'bg-white border-white text-black'
                        : 'bg-black border-black text-white'
                      : theme === 'dark'
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-300'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm">{type.icon}</span>
                    <span className="text-[10px] font-light tracking-wide leading-tight">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className={`block text-xs font-medium tracking-wider uppercase ${
              theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              Description
            </label>
            <textarea
              value={clubDescription}
              onChange={(e) => setClubDescription(e.target.value)}
              className={`
                w-full px-3 py-2 text-sm font-light rounded border transition-all duration-200 resize-none tracking-wide
                focus:outline-none focus:border-white
                ${theme === 'dark' 
                  ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus:bg-black' 
                  : 'bg-zinc-50 border-zinc-200 text-black placeholder-zinc-500 focus:bg-white'
                }
              `}
              rows={1}
              placeholder="What makes your club special?"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className={`
                flex-1 px-3 py-2 text-xs font-light rounded border transition-all duration-200 tracking-wide
                ${theme === 'dark' 
                  ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white' 
                  : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100 hover:text-black'
                }
              `}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!clubName.trim() || !clubType}
              className={`
                flex-1 px-3 py-2 text-xs font-medium rounded border transition-all duration-200 tracking-wide
                bg-white border-white text-black
                hover:bg-zinc-100 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100
                flex items-center justify-center gap-1
              `}
            >
              <span>Create</span>
              <ArrowRight className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};