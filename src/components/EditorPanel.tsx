'use client';

import React, { useRef, useState } from 'react';
import {
  ClipboardPaste,
  Trash2,
  Upload,
  FileText,
  SplitSquareVertical,
  Plus,
  X,
  Eye,
} from 'lucide-react';
import { PageData, DistributionMode } from '../types';

interface EditorPanelProps {
  text: string;
  onTextChange: (newText: string) => void;
  pages: PageData[];
  distributionMode: DistributionMode;
  manualBreaks: number[];
  onManualBreaksChange: (breaks: number[]) => void;
  highlightedPageIndex: number | null;
  onSelectPage: (index: number) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  text,
  onTextChange,
  pages,
  distributionMode,
  manualBreaks,
  onManualBreaksChange,
  highlightedPageIndex,
  onSelectPage,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Compute text stats
  const charCount = text.length;
  const wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
  const paragraphCount = text.trim().length === 0 ? 0 : text.split(/\r?\n\s*\r?\n/).filter((p) => p.trim().length > 0).length;

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        onTextChange(clipText);
      }
    } catch {
      // If clipboard permission rejected, focus textarea
      textareaRef.current?.focus();
    }
  };

  const handleClear = () => {
    onTextChange('');
  };

  const handleFileLoad = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        onTextChange(content);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileLoad(e.dataTransfer.files[0]);
    }
  };

  const handleAddBreakAtCursor = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart ?? 0;
    if (pos > 0 && pos < text.length && !manualBreaks.includes(pos)) {
      const updated = [...manualBreaks, pos].sort((a, b) => a - b);
      onManualBreaksChange(updated);
    }
  };

  const handleRemoveBreak = (breakPos: number) => {
    onManualBreaksChange(manualBreaks.filter((b) => b !== breakPos));
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 select-none">
      {/* Top action toolbar */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950/40 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
          <span>{wordCount} words</span>
          <span className="text-zinc-700">•</span>
          <span>{charCount} chars</span>
          <span className="text-zinc-700">•</span>
          <span>{paragraphCount} paras</span>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileLoad(e.target.files[0]);
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition-colors"
            title="Load .txt or .md file"
          >
            <Upload className="w-3 h-3" />
            <span>Load File</span>
          </button>
          <button
            type="button"
            onClick={handlePaste}
            className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition-colors"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="w-3 h-3" />
            <span>Paste</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-zinc-400 hover:text-red-400 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            title="Clear text"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Manual mode page-break tools */}
      {distributionMode === 'manual' && (
        <div className="px-3 py-2 bg-amber-950/20 border-b border-amber-900/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="font-medium">Manual Break Controls:</span>
          </div>
          <button
            type="button"
            onClick={handleAddBreakAtCursor}
            className="flex items-center gap-1 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-1 rounded transition-colors"
            title="Place cursor in text and click to insert page break"
          >
            <Plus className="w-3 h-3" />
            <span>Insert Break at Cursor</span>
          </button>
        </div>
      )}

      {/* Manual breaks list */}
      {distributionMode === 'manual' && manualBreaks.length > 0 && (
        <div className="px-3 py-1.5 bg-zinc-950/60 border-b border-zinc-800 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {manualBreaks.map((bPos, idx) => (
            <div
              key={bPos}
              className="flex items-center gap-1 text-[11px] bg-zinc-800/90 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700"
            >
              <span>Break {idx + 1} (pos {bPos})</span>
              <button
                type="button"
                onClick={() => handleRemoveBreak(bPos)}
                className="text-zinc-500 hover:text-red-400 p-0.5"
                title="Remove break"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Textarea container */}
      <div
        className={`flex-1 relative p-3 flex flex-col transition-colors ${
          isDraggingOver ? 'bg-zinc-800/40 border-2 border-dashed border-zinc-500' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste or write your essay or thoughts here...

The pagination engine will automatically balance your writing across clean, deterministic images without AI rewriting, cropping, or character loss."
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className="w-full flex-1 bg-transparent text-zinc-100 text-sm leading-relaxed outline-none resize-none font-sans placeholder:text-zinc-600 select-text"
        />

        {/* Drag drop overlay text */}
        {isDraggingOver && (
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-zinc-300">
              <FileText className="w-8 h-8 text-zinc-400" />
              <p className="text-sm font-medium">Drop text or markdown file here</p>
            </div>
          </div>
        )}
      </div>

      {/* Page Boundaries / Segments Navigation Footer */}
      {pages.length > 1 && (
        <div className="border-t border-zinc-800 bg-zinc-950/60 p-2.5 space-y-1.5 select-none">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-zinc-500">
              Page Segments ({pages.length})
            </span>
            <span className="text-zinc-500">Click to focus</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {pages.map((p, idx) => {
              const isHovered = highlightedPageIndex === idx;
              const hasOverflow = p.isOverflowing;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelectPage(idx);
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                      textareaRef.current.setSelectionRange(p.startIndex, p.endIndex);
                    }
                  }}
                  className={`text-xs px-2 py-1 rounded border flex items-center gap-1.5 transition-all ${
                    isHovered
                      ? 'bg-zinc-700 text-white border-zinc-500 ring-1 ring-zinc-400'
                      : hasOverflow
                      ? 'bg-red-950/30 text-red-300 border-red-800/50 hover:bg-red-900/40'
                      : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                  title={`Page ${idx + 1}: chars ${p.startIndex}-${p.endIndex}, Util: ${p.utilization}%`}
                >
                  <Eye className="w-3 h-3 opacity-60" />
                  <span>Page {idx + 1}</span>
                  <span
                    className={`text-[10px] px-1 rounded font-mono ${
                      hasOverflow ? 'bg-red-900/80 text-red-200' : 'bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    {p.utilization}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
