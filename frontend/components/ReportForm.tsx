import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Send } from 'lucide-react';
import { apiSubmitReport } from '../services/mockApi';

const BUILDINGS = [1, 2, 3, 4];
const LEVELS = ['Basement', '1', '2', '3', '4', '5', '6'];
const SIDES = ['Front', 'Behind'];

interface ReportFormProps {
  type: 'bin' | 'complaint';
  onSuccess: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ type, onSuccess }) => {
  const [building, setBuilding] = useState<number>(1);
  const [level, setLevel] = useState<string>('1');
  const [side, setSide] = useState<string>('Front');
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);

  // Dynamic Location Suggestions (The "Human Sensor" Core)
  useEffect(() => {
    let options: string[] = [];

    if (level === 'Basement') {
        options = ['Canteen Bins', 'Car Parking Area'];
    } else if (level === '1') {
        // Level 1 Specifics
        if (building === 1 || building === 4) {
            options = ['Ground Floor Lobby (No specific rooms)'];
        } else if (building === 2) {
            options = ['Student Affairs', 'Accounting Department'];
        } else if (building === 3) {
            options = ['Library', 'Meeting Room'];
        }
    } else {
        // Levels 2-6 (Standard + Theatres)
        const numericLevel = parseInt(level);
        
        // Standard Middle Room Rule
        if (side === 'Front') {
            options.push(`Bin near Room ${numericLevel}22`);
        } else {
            options.push(`Bin near Room ${numericLevel}25`);
        }

        // Special Level 2 Logic for B1 & B2 (Theatres)
        if (numericLevel === 2 && (building === 1 || building === 2)) {
             options.push('Theatres (Front Side Entry)');
        }
    }

    setLocationOptions(options);
    setSelectedLocation(options[0] || '');
  }, [building, level, side]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiSubmitReport({
        building: building.toString(),
        level: level,
        location: selectedLocation,
        description,
        imageUrl: photo ? URL.createObjectURL(photo) : undefined
      });
      alert(type === 'bin' ? "Report Submitted!" : "Complaint Lodged!");
      onSuccess();
    } catch (err) {
      alert("Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  const isStandardFloor = level !== 'Basement' && level !== '1';

  return (
    <div className="max-w-2xl mx-auto p-4 animate-fade-in pb-20">
      <div className="bg-white dark:bg-uit-card rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
          {type === 'bin' ? <MapPin className="text-uit-neon" /> : <Send className="text-uit-neon" />}
          {type === 'bin' ? 'Report Full Bin' : 'Lodge Complaint'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Linked Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Building</label>
              <select
                value={building}
                onChange={(e) => setBuilding(Number(e.target.value))}
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-uit-neon"
              >
                {BUILDINGS.map(b => <option key={b} value={b}>Building {b}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-uit-neon"
              >
                {LEVELS.map(l => <option key={l} value={l}>{l === 'Basement' ? 'Basement' : `Level ${l}`}</option>)}
              </select>
            </div>

            <div className={`${!isStandardFloor ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Side</label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value)}
                disabled={!isStandardFloor}
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-uit-neon"
              >
                {SIDES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Smart Location Result */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specific Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-uit-neon font-medium text-uit-accent"
            >
              {locationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">
                *Options automatically filtered based on building structure.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the issue..."
              className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-uit-neon"
              required
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-dashed border-gray-400">
              <Camera size={20} />
              <span>{photo ? photo.name : "Capture/Upload Photo"}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-uit-neon hover:bg-green-400 text-uit-dark font-bold text-lg rounded-xl shadow-lg transform hover:-translate-y-1 transition-all flex justify-center items-center gap-2"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
            {!loading && <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;