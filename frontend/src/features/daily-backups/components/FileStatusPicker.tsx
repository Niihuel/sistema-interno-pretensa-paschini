import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, Loader2 } from 'lucide-react';
import type { BackupStatus } from '../types';

interface FileStatusPickerProps {
  status?: BackupStatus;
  availableStatuses?: BackupStatus[];
  onToggle: () => void;
  onSelectStatus?: (statusId: number) => void;
  fileName: string;
  isLoading?: boolean;
}

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  if (![3, 6].includes(sanitized.length)) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  const normalized = sanitized.length === 3
    ? sanitized.split('').map((c) => c + c).join('')
    : sanitized;
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const resolveStatusIcon = (status?: BackupStatus) => {
  if (!status) return Circle;
  if (status.isFinal) return CheckCircle2;
  if (status.code?.toUpperCase().includes('PROGRESS')) return Clock;
  return Circle;
};

const resolveStatusLabel = (status?: BackupStatus) => status?.label ?? 'Sin estado';

export const FileStatusPicker: React.FC<FileStatusPickerProps> = ({
  status,
  availableStatuses = [],
  onToggle,
  onSelectStatus,
  fileName,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'right' | 'left'>('right');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const StatusIcon = resolveStatusIcon(status);
  const baseColor = status?.color ?? (status?.isFinal ? '#34d399' : status?.code?.toUpperCase().includes('PROGRESS') ? '#facc15' : '#94a3b8');
  const backgroundStyle = { backgroundColor: hexToRgba(baseColor, 0.2), borderColor: hexToRgba(baseColor, 0.35) };
  const iconStyle = { color: baseColor };

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      if (buttonRect.right + 240 > windowWidth) {
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

  const handleToggle = () => {
    onToggle();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all duration-300 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        title={`Estado: ${resolveStatusLabel(status)}`}
        style={backgroundStyle}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 animate-spin" />
        ) : (
          <StatusIcon className="w-4 h-4 sm:w-5 sm:h-5" style={iconStyle} />
        )}
      </button>

      {isOpen && (
        <div
          className={`
            absolute top-full mt-2 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-[9999]
            min-w-[200px] sm:min-w-[220px] max-w-[90vw]
            ${position === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          <div className="p-2 overflow-y-auto" style={{ maxHeight: '16rem' }}>
            <div className="text-xs text-white/50 uppercase tracking-wide px-3 py-2 mb-1 truncate">
              {fileName}
            </div>

            {availableStatuses.length > 0 ? (
              <>
                {availableStatuses.map((availStatus) => {
                  const isActive = status?.id === availStatus.id;
                  const StatusIconForOption = resolveStatusIcon(availStatus);
                  const optionColor = availStatus.color ?? (availStatus.isFinal ? '#34d399' : availStatus.code?.toUpperCase().includes('PROGRESS') ? '#facc15' : '#94a3b8');
                  const optionBgStyle = { backgroundColor: hexToRgba(optionColor, 0.2), borderColor: hexToRgba(optionColor, 0.35) };

                  return (
                    <button
                      key={availStatus.id}
                      onClick={() => {
                        if (onSelectStatus) {
                          onSelectStatus(availStatus.id);
                        } else {
                          onToggle();
                        }
                        setIsOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all text-sm
                        ${
                          isActive
                            ? 'border'
                            : 'hover:bg-white/5 border border-transparent'
                        }
                      `}
                      style={isActive ? optionBgStyle : undefined}
                    >
                      <div className="flex items-center gap-2" style={{ color: optionColor }}>
                        <StatusIconForOption className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium text-white">{availStatus.label}</span>
                      </div>
                      {isActive && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: optionColor }} />}
                    </button>
                  );
                })}
              </>
            ) : (
              <button
                onClick={handleToggle}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 transition-all"
              >
                <Circle className="w-4 h-4" />
                <span className="font-medium text-xs sm:text-sm">Cambiar Estado</span>
              </button>
            )}
          </div>
          {availableStatuses.length === 0 && (
            <div className="border-t border-white/10 p-2">
              <p className="text-xs text-white/40 px-3 py-1">
                Cambia para avanzar al siguiente estado configurado.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
