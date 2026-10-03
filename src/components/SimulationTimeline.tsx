import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Clock } from 'lucide-react';

interface SimulationTimelineProps {
  currentTimeHours: number;
  durationHours: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onPlayToggle: () => void;
  onReset: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
}

export const SimulationTimeline: React.FC<SimulationTimelineProps> = ({
  currentTimeHours,
  durationHours,
  isPlaying,
  playbackSpeed,
  onPlayToggle,
  onReset,
  onSeek,
  onSpeedChange,
}) => {
  const speeds = [0.5, 1, 2, 5, 10];

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Playback Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPlayToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/40'
              : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-md shadow-cyan-950/40'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY KINETICS'}</span>
        </button>

        <button
          onClick={onReset}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Reset Simulation Time"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{currentTimeHours.toFixed(1)}h / {durationHours}h</span>
        </div>
      </div>

      {/* Scrubber Range Slider */}
      <div className="flex-1 w-full sm:max-w-md flex items-center gap-3">
        <span className="text-[10px] font-mono text-slate-500">0h</span>
        <input
          type="range"
          min="0"
          max={durationHours}
          step="0.5"
          value={currentTimeHours}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <span className="text-[10px] font-mono text-slate-500">{durationHours}h</span>
      </div>

      {/* Speed Multiplier */}
      <div className="flex items-center gap-1.5 text-xs font-mono">
        <span className="text-slate-400 text-[10px] uppercase">Speed:</span>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                playbackSpeed === s ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
