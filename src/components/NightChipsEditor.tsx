'use client';

import type { DragEvent } from 'react';
import { nightsOnStop } from '@/lib/split-stop-nights';
import { isoAddDays } from '@/lib/trip-stops';
import type { TripStop } from '@/types/trip';

export type PickedNight = { stopId: string; nightIndex: number };

function fmtChip(iso: string) {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

export function isSamePickedNight(a: PickedNight | null, b: PickedNight): boolean {
  return Boolean(a && a.stopId === b.stopId && a.nightIndex === b.nightIndex);
}

interface StopNightsRowProps {
  stop: TripStop;
  tripStart?: string;
  picked: PickedNight | null;
  isDropTarget: boolean;
  dropLabel: string;
  onPick: (night: PickedNight) => void;
  onClearPick: () => void;
  onDropOnStop: (toStopId: string) => void;
  onDragOverChange: (stopId: string | null) => void;
}

/** Per-stop night chips + empty drop target. Pick state lives on the parent. */
export function StopNightsRow({
  stop,
  tripStart,
  picked,
  isDropTarget,
  dropLabel,
  onPick,
  onClearPick,
  onDropOnStop,
  onDragOverChange,
}: StopNightsRowProps) {
  const nights = nightsOnStop(stop);
  const canReceive = Boolean(picked && picked.stopId !== stop.id);

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    onDragOverChange(stop.id);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    onDropOnStop(stop.id);
    onDragOverChange(null);
  }

  if (nights === 0) {
    return (
      <button
        type="button"
        onDragOver={handleDragOver}
        onDragLeave={() => onDragOverChange(null)}
        onDrop={handleDrop}
        onClick={(e) => {
          e.stopPropagation();
          onDropOnStop(stop.id);
        }}
        aria-label={
          canReceive
            ? `Move selected night to ${dropLabel}`
            : `${dropLabel}: no nights yet. Tap a night chip, then tap here to move it.`
        }
        className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl border-2 border-dashed text-sm text-left transition-colors ${
          isDropTarget || canReceive
            ? 'border-slate-900 bg-slate-50 text-slate-900'
            : 'border-slate-300 bg-slate-50 text-slate-600'
        }`}
      >
        <span className="block font-medium">
          {canReceive ? 'Tap to move the selected night here' : 'No nights yet'}
        </span>
        <span className="block text-xs text-slate-500 mt-0.5">
          {canReceive ? dropLabel : 'Tap a date chip, then tap here'}
        </span>
      </button>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => onDragOverChange(null)}
      onDrop={handleDrop}
      onClick={(e) => {
        if (canReceive) {
          e.stopPropagation();
          onDropOnStop(stop.id);
        }
      }}
      className={`rounded-xl border px-3 py-2 min-h-[44px] transition-colors ${
        isDropTarget || canReceive
          ? 'border-slate-900 bg-slate-50'
          : 'border-slate-200 bg-slate-50/80'
      }`}
    >
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: nights }, (_, i) => {
          const date =
            stop.startDate || tripStart
              ? isoAddDays(stop.startDate || tripStart || '', i)
              : '';
          const night: PickedNight = { stopId: stop.id, nightIndex: i };
          const selected = isSamePickedNight(picked, night);
          const label = date ? fmtChip(date) : `Night ${i + 1}`;
          return (
            <button
              key={`${stop.id}-${i}`}
              type="button"
              draggable
              aria-pressed={selected}
              aria-label={
                selected
                  ? `${label} selected. Tap a city to move this night.`
                  : `Night of ${label} in ${dropLabel}`
              }
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', stop.id);
                e.dataTransfer.effectAllowed = 'move';
                onPick(night);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (picked && picked.stopId !== stop.id) {
                  onDropOnStop(stop.id);
                  return;
                }
                if (selected) onClearPick();
                else onPick(night);
              }}
              className={`h-8 px-2.5 rounded-full border text-[11px] font-medium cursor-grab active:cursor-grabbing ${
                selected
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface NightMoveStatusProps {
  picked: PickedNight | null;
  totalNights: number;
  stopCount: number;
  onCancel: () => void;
  onResetEvenSplit?: () => void;
}

export function NightMoveStatus({
  picked,
  totalNights,
  stopCount,
  onCancel,
  onResetEvenSplit,
}: NightMoveStatusProps) {
  if (picked) {
    return (
      <div
        role="status"
        className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 text-white px-3.5 py-2.5"
      >
        <p className="text-xs font-medium leading-snug">
          1 night selected — tap a city to move it
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 text-[11px] font-medium underline underline-offset-2 text-white/80 hover:text-white"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs text-slate-500 leading-relaxed">
        {`${totalNights} ${totalNights === 1 ? 'night' : 'nights'} across ${stopCount} ${
          stopCount === 1 ? 'stop' : 'stops'
        }. Drag a night onto any city — or tap a chip, then tap another stop.`}
      </p>
      {onResetEvenSplit && stopCount >= 2 && (
        <button
          type="button"
          onClick={onResetEvenSplit}
          className="shrink-0 text-[11px] font-medium text-slate-500 hover:text-slate-900 underline underline-offset-2"
        >
          Reset even split
        </button>
      )}
    </div>
  );
}
