'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FileText, SplitSquareVertical, Plus } from 'lucide-react';
import { PageData, DistributionMode, TypographySettings } from '../types';

interface EditorPanelProps {
  text: string;
  onTextChange: (newText: string) => void;
  pages: PageData[];
  distributionMode: DistributionMode;
  manualBreaks: number[];
  onManualBreaksChange: (breaks: number[]) => void;
  highlightedPageIndex: number | null;
  onSelectPage: (index: number) => void;
  typography?: TypographySettings;
  highlightedParagraph?: {
    pageIndex: number;
    paragraphIndex: number;
    startIndex: number;
    endIndex: number;
  } | null;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  text,
  onTextChange,
  pages,
  distributionMode,
  manualBreaks,
  onManualBreaksChange,
  highlightedPageIndex,
  typography,
  highlightedParagraph,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const spotlightLayerRef = useRef<HTMLDivElement>(null);
  const highlightedParagraphRef = useRef(highlightedParagraph);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const measureAndApplySpotlight = React.useCallback(
    (target: { startIndex: number; endIndex: number } | null | undefined) => {
      const ta = textareaRef.current;
      const mirror = mirrorRef.current;
      const spotlight = spotlightRef.current;
      const spotlightLayer = spotlightLayerRef.current;
      if (!ta || !mirror || !spotlight || !spotlightLayer) return;

      if (!target) {
        spotlight.style.opacity = '0';
        return;
      }

      const computed = window.getComputedStyle(ta);
      const padL = parseFloat(computed.paddingLeft) || 0;
      const padR = parseFloat(computed.paddingRight) || 0;
      const padT = parseFloat(computed.paddingTop) || 0;
      const contentWidth = Math.max(10, ta.clientWidth - padL - padR);

      mirror.style.boxSizing = 'content-box';
      mirror.style.width = `${contentWidth}px`;
      mirror.style.padding = '0px';
      mirror.style.border = 'none';
      mirror.style.fontFamily = computed.fontFamily;
      mirror.style.fontSize = computed.fontSize;
      mirror.style.fontWeight = computed.fontWeight;
      mirror.style.lineHeight = computed.lineHeight;
      mirror.style.letterSpacing = computed.letterSpacing;
      mirror.style.textAlign = computed.textAlign;

      const start = Math.max(0, Math.min(text.length, target.startIndex));
      const end = Math.max(start, Math.min(text.length, target.endIndex));
      const targetRaw = text.slice(start, end);

      // Strip leading and trailing newlines so spanTarget tightly bounds the visible text lines
      const leadingMatch = targetRaw.match(/^[\r\n]+/);
      const leadingLen = leadingMatch ? leadingMatch[0].length : 0;
      const effectiveStart = start + leadingLen;
      const effectiveTargetRaw = targetRaw.slice(leadingLen);
      const trailingMatch = effectiveTargetRaw.match(/[\r\n]+$/);
      const trailingLen = trailingMatch ? trailingMatch[0].length : 0;
      const targetContent = effectiveTargetRaw.slice(0, effectiveTargetRaw.length - trailingLen);

      if (targetContent.trim().length === 0) {
        spotlight.style.opacity = '0';
        return;
      }

      mirror.innerHTML = '';
      const spanBefore = document.createElement('span');
      spanBefore.textContent = text.slice(0, effectiveStart);

      const spanTarget = document.createElement('span');
      spanTarget.textContent = targetContent;

      mirror.appendChild(spanBefore);
      mirror.appendChild(spanTarget);

      const mirrorRect = mirror.getBoundingClientRect();
      const targetRect = spanTarget.getBoundingClientRect();

      let topY = padT;
      let height = 28;

      if (targetRect.height > 0) {
        topY = targetRect.top - mirrorRect.top + padT;
        height = targetRect.height;
      } else {
        // Fallback for headless environments
        mirror.textContent = text.slice(0, effectiveStart);
        topY = mirror.scrollHeight + padT;
        mirror.textContent = text.slice(0, effectiveStart) + targetContent;
        height = Math.max(28, mirror.scrollHeight + padT - topY);
      }

      spotlight.style.top = `${Math.max(0, topY - 2)}px`;
      spotlight.style.height = `${height + 4}px`;
      spotlight.style.opacity = '1';
      spotlightLayer.style.transform = `translateY(-${ta.scrollTop}px)`;

      const viewportHeight = ta.clientHeight;
      const currentScroll = ta.scrollTop;
      const isAbove = topY < currentScroll + 30;
      const isBelow = topY + height > currentScroll + viewportHeight - 30;

      if (isAbove || isBelow) {
        const targetScroll = Math.max(0, topY - Math.round(viewportHeight * 0.25));
        ta.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    },
    [text]
  );

  useEffect(() => {
    highlightedParagraphRef.current = highlightedParagraph;
    measureAndApplySpotlight(highlightedParagraph);
  }, [highlightedParagraph, measureAndApplySpotlight, typography]);

  useEffect(() => {
    if (!textareaRef.current) return;
    const ro = new ResizeObserver(() => {
      if (highlightedParagraphRef.current) {
        measureAndApplySpotlight(highlightedParagraphRef.current);
      }
    });
    ro.observe(textareaRef.current);
    return () => ro.disconnect();
  }, [measureAndApplySpotlight]);

  // Auto-scroll to exact pixel position when a preview page is hovered or clicked (if no granular paragraph spotlight active)
  useEffect(() => {
    if (highlightedParagraph) return;
    if (highlightedPageIndex === null || !pages[highlightedPageIndex]) return;
    const p = pages[highlightedPageIndex];
    const ta = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!ta || !mirror) return;

    if (p.startIndex === 0) {
      ta.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const computed = window.getComputedStyle(ta);
    const padL = parseFloat(computed.paddingLeft) || 0;
    const padR = parseFloat(computed.paddingRight) || 0;
    const padT = parseFloat(computed.paddingTop) || 0;
    const contentWidth = Math.max(10, ta.clientWidth - padL - padR);

    mirror.style.boxSizing = 'content-box';
    mirror.style.width = `${contentWidth}px`;
    mirror.style.padding = '0px';
    mirror.style.border = 'none';
    mirror.style.fontFamily = computed.fontFamily;
    mirror.style.fontSize = computed.fontSize;
    mirror.style.fontWeight = computed.fontWeight;
    mirror.style.lineHeight = computed.lineHeight;
    mirror.style.letterSpacing = computed.letterSpacing;

    mirror.innerHTML = '';
    const spanBefore = document.createElement('span');
    spanBefore.textContent = text.slice(0, p.startIndex);
    const spanTarget = document.createElement('span');
    spanTarget.textContent = p.text.trim().slice(0, 100);
    mirror.appendChild(spanBefore);
    mirror.appendChild(spanTarget);

    const mirrorRect = mirror.getBoundingClientRect();
    const targetRect = spanTarget.getBoundingClientRect();
    let targetY = padT;
    if (targetRect.height > 0) {
      targetY = targetRect.top - mirrorRect.top + padT;
    } else {
      mirror.textContent = text.slice(0, p.startIndex);
      targetY = mirror.scrollHeight;
    }

    const targetScroll = Math.max(0, targetY - 8);
    ta.scrollTo({ top: targetScroll, behavior: 'smooth' });
  }, [highlightedParagraph, highlightedPageIndex, pages, text]);

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

  return (
    <div
      className="relative flex flex-col h-full w-full bg-[var(--bg-editor)] overflow-hidden select-text"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      {/* Manual mode break action bar (only in manual mode) */}
      {distributionMode === 'manual' && (
        <div className="px-6 py-2 bg-[#08080a] border-b border-[#18181b] flex items-center justify-between text-xs shrink-0 select-none">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <SplitSquareVertical className="w-3.5 h-3.5 text-zinc-400" />
            <span>Manual breaks ({manualBreaks.length})</span>
          </div>
          <button
            type="button"
            onClick={handleAddBreakAtCursor}
            className="flex items-center gap-1 text-[11px] bg-[#141417] hover:bg-[#222228] text-zinc-200 border border-[#27272a] px-2.5 py-1 rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Insert break at cursor</span>
          </button>
        </div>
      )}

      {/* Editorial Writing Canvas (snug top start, zero navbar) */}
      <div className="relative flex-1 w-full pt-5 pb-4 px-7 flex flex-col min-h-0 overflow-hidden">
        {/* Paragraph Spotlight Backdrop Layer (clipped to editor viewport) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div
            ref={spotlightLayerRef}
            className="absolute inset-x-0 top-5"
            style={{ transform: 'translateY(0px)' }}
          >
            <div
              ref={spotlightRef}
              className="absolute left-2 right-4 sm:left-3 sm:right-6 rounded-lg pointer-events-none transition-all duration-150 ease-out opacity-0 bg-gradient-to-r from-amber-400/[0.18] via-amber-400/[0.08] to-transparent dark:bg-gradient-to-r dark:from-amber-400/[0.14] dark:via-amber-500/[0.05] dark:to-transparent shadow-[0_0_24px_rgba(245,158,11,0.06)]"
              style={{
                top: 0,
                height: 0,
              }}
            />
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onScroll={(e) => {
            if (spotlightLayerRef.current) {
              spotlightLayerRef.current.style.transform = `translateY(-${e.currentTarget.scrollTop}px)`;
            }
          }}
          placeholder="Start writing or paste your text here..."
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            fontFamily: typography?.fontFamily ?? 'Inter',
            textAlign: typography?.alignment ?? 'left',
            lineHeight: typography?.lineHeight ?? 1.75,
            letterSpacing: typography?.letterSpacing ? `${typography.letterSpacing}px` : undefined,
            fontWeight: typography?.fontWeight ?? 400,
          }}
          className="relative z-10 w-full flex-1 bg-transparent text-[var(--text-primary)] text-[17px] tracking-tight outline-none resize-none placeholder:text-[var(--text-dim)] caret-[var(--text-primary)] selection:bg-zinc-800 no-scrollbar overflow-y-auto pb-16"
        />

        {/* Soft bottom edge gradient fade (signals scroll affordance cleanly without UI clutter) */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/70 to-transparent editor-bottom-fade z-20" />

        {/* Drag & drop overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xs flex items-center justify-center pointer-events-none z-30">
            <div className="flex flex-col items-center gap-2 text-zinc-300">
              <FileText className="w-8 h-8 text-zinc-400" />
              <p className="text-sm font-medium">Drop text (.txt) or markdown (.md) here</p>
            </div>
          </div>
        )}
      </div>

      {/* Invisible mirror div for 100% exact layout calculation */}
      <div
        ref={mirrorRef}
        aria-hidden="true"
        className="absolute top-5 left-7 pointer-events-none opacity-0 select-none overflow-hidden -z-50"
        style={{
          visibility: 'hidden',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      />
    </div>
  );
};
