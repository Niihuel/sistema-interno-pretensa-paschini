import React, { useState, useRef, useEffect, useMemo } from 'react';
import { HardDrive, Check } from 'lucide-react';
import type { BackupDisk } from '../types';

interface DiskSelectorProps {
  currentDisk?: BackupDisk | null;
  disks: BackupDisk[];
  onDiskChange: (sequence: number) => void;
  isLoading?: boolean;
}

const getDiskBadgeStyle = (color?: string) => (
  color
    ? {
        backgroundColor: `${color}33`,
        borderColor: `${color}66`,
      }
    : undefined
);

export const DiskSelector: React.FC<DiskSelectorProps> = ({
  currentDisk,
  disks,
  onDiskChange,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'right' | 'left'>('right');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const activeDisks = useMemo(() => disks.filter((disk) => disk.isActive).sort((a, b) => a.sequence - b.sequence), [disks]);

  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const dropdownWidth = 240;
      const spaceOnRight = windowWidth - buttonRect.right;
      const spaceOnLeft = buttonRect.left;

      if (spaceOnRight < dropdownWidth && spaceOnLeft > spaceOnRight) {
        setPosition('left');
      } else {
        setPosition('right');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (sequence: number) => {
    onDiskChange(sequence);
    setIsOpen(false);
  };

  const currentLabel = currentDisk ? currentDisk.name ?? `Disco ${currentDisk.sequence}` : 'Sin disco';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || activeDisks.length === 0}
        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <HardDrive className="w-4 h-4" />
        <span>{currentLabel}</span>
      </button>

      {isOpen && (
        <div
          className={`
            absolute top-full mt-2 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-[9999]
            min-w-[220px] w-max max-w-[280px]
            ${position === 'left' ? 'right-0' : 'left-0'}
          `}
          style={{ maxWidth: 'calc(100vw - 32px)' }}
        >
          <div className="p-2 overflow-y-auto" style={{ maxHeight: '16rem' }}>
            <div className="text-xs text-white/50 uppercase tracking-wide px-3 py-2 mb-1">
              Seleccionar Disco
            </div>
            {activeDisks.length === 0 && (
              <div className="px-3 py-2 text-xs text-white/50">
                No hay discos activos configurados.
              </div>
            )}
            {activeDisks.map((disk) => {
              const isActive = currentDisk?.id === disk.id;
              return (
                <button
                  key={disk.id}
                  onClick={() => handleSelect(disk.sequence)}
                  className={`
                    w-full flex items-center justify-between gap-2 px-3 py-2 sm:py-2.5 rounded-lg transition-all text-sm
                    ${
                      isActive
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'hover:bg-white/5 text-white/80 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/20"
                      style={getDiskBadgeStyle(disk.color)}
                    />
                    <div className="flex flex-col items-start">
                      <span className="font-medium leading-tight">{disk.name}</span>
                      <span className="text-[11px] text-white/40">Secuencia {disk.sequence}</span>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
