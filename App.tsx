
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Activity, 
  Map as MapIcon, 
  Layers, 
  Flame, 
  Settings2, 
  Info, 
  Play, 
  Pause, 
  BrainCircuit,
  Calendar,
  Waves,
  Maximize2,
  HelpCircle,
  AlertCircle,
  Mountain
} from 'lucide-react';
import { Earthquake, TimeRange, Volcano, AIExplanation, Plate } from './types';
import { fetchEarthquakes } from './services/usgsService';
import { getAIExplanation, getPlateExplanation, getVolcanoExplanation } from './services/geminiService';
import EarthquakeMap from './components/EarthquakeMap';

const VOLCANOES: Volcano[] = [
  { name: 'Etna', country: 'Olaszország', coordinates: [14.99, 37.75], type: 'Stratovulkán', elevation: 3326 },
  { name: 'Fuji', country: 'Japán', coordinates: [138.73, 35.36], type: 'Stratovulkán', elevation: 3776 },
  { name: 'Popocatépetl', country: 'Mexikó', coordinates: [-98.62, 19.02], type: 'Stratovulkán', elevation: 5426 },
  { name: 'Vezúv', country: 'Olaszország', coordinates: [14.43, 40.82], type: 'Stratovulkán', elevation: 1281 },
  { name: 'Krakatoa', country: 'Indonézia', coordinates: [105.42, -6.10], type: 'Kaldera', elevation: 813 },
  { name: 'Kilauea', country: 'Hawaii, USA', coordinates: [-155.28, 19.42], type: 'Pajzsvulkán', elevation: 1247 },
  { name: 'Szent Helens', country: 'USA', coordinates: [-122.19, 46.19], type: 'Stratovulkán', elevation: 2549 },
  { name: 'Merapi', country: 'Indonézia', coordinates: [110.44, -7.54], type: 'Stratovulkán', elevation: 2930 },
  { name: 'Cotopaxi', country: 'Ecuador', coordinates: [-78.43, -0.68], type: 'Stratovulkán', elevation: 5897 },
];

const App: React.FC = () => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [minMagnitude, setMinMagnitude] = useState(4.0);
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.Week);
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showPlates, setShowPlates] = useState(true);
  const [showVolcanoes, setShowVolcanoes] = useState(true);
  
  const [selectedEq, setSelectedEq] = useState<Earthquake | null>(null);
  const [selectedPlate, setSelectedPlate] = useState<Plate | null>(null);
  const [selectedVolcano, setSelectedVolcano] = useState<Volcano | null>(null);
  
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Timeline State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(Date.now());
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // multiplier

  // Initial Data Fetch
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchEarthquakes(timeRange, minMagnitude);
      setEarthquakes(data);
      if (data.length > 0) {
        const sorted = [...data].sort((a, b) => a.time - b.time);
        setCurrentTimestamp(sorted[sorted.length - 1].time);
      }
    };
    loadData();
  }, [timeRange, minMagnitude]);

  // Timeline Logic
  useEffect(() => {
    let interval: number | undefined;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCurrentTimestamp(prev => {
          const step = 3600000 * 6 * playbackSpeed; // 6 hours per tick * speed
          const next = prev + step;
          const maxTime = Date.now();
          if (next >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const handleAiRequest = async () => {
    setAiExplanation(null);
    setIsAiLoading(true);
    try {
      if (selectedEq) {
        const explanation = await getAIExplanation(selectedEq);
        setAiExplanation(explanation);
      } else if (selectedPlate) {
        const explanation = await getPlateExplanation(selectedPlate);
        setAiExplanation(explanation);
      } else if (selectedVolcano) {
        const explanation = await getVolcanoExplanation(selectedVolcano);
        setAiExplanation(explanation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Reset explanation when selection changes
  useEffect(() => {
    setAiExplanation(null);
  }, [selectedEq, selectedPlate, selectedVolcano]);

  const timeLimits = useMemo(() => {
    if (earthquakes.length === 0) return { min: Date.now() - 604800000, max: Date.now() };
    const sorted = [...earthquakes].sort((a, b) => a.time - b.time);
    return { min: sorted[0].time, max: Date.now() };
  }, [earthquakes]);

  const uncertaintyColor = (level: string) => {
    switch(level) {
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const uncertaintyLabel = (level: string) => {
    switch(level) {
      case 'low': return 'Alacsony bizonytalanság';
      case 'medium': return 'Közepes bizonytalanság';
      case 'high': return 'Magas bizonytalanság';
      default: return level;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 gap-4">
      {/* Header */}
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Earth Pulse Map</h1>
            <p className="text-xs text-slate-400">Tanári Segéd • Középiskolai Földrajz</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>{new Date(currentTimestamp).toLocaleDateString('hu-HU')}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full">
            <Activity className="w-3.5 h-3.5 text-yellow-400" />
            <span>{earthquakes.filter(e => e.time <= currentTimestamp).length} esemény</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left Panel: Controls */}
        <aside className="w-80 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col gap-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
              <Settings2 className="w-4 h-4 text-blue-400" />
              Beállítások
            </div>
            
            <section className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Időtartam</label>
                <div className="grid grid-cols-2 gap-2">
                  {[TimeRange.Day, TimeRange.Week, TimeRange.Month, TimeRange.Year].map(range => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                        timeRange === range 
                          ? 'bg-blue-600 border-blue-500 text-white' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {range === TimeRange.Day ? 'Nap' : range === TimeRange.Week ? 'Hét' : range === TimeRange.Month ? 'Hónap' : 'Év'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Min. Magnitúdó</label>
                  <span className="text-xs font-mono text-blue-400 font-bold">{minMagnitude.toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="3.0" 
                  max="7.0" 
                  step="0.1" 
                  value={minMagnitude}
                  onChange={(e) => setMinMagnitude(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </section>

            <section className="space-y-3 pt-4 border-t border-slate-800">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rétegek</label>
               <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-3">
                      <Activity className={`w-4 h-4 ${showEarthquakes ? 'text-yellow-400' : 'text-slate-500'}`} />
                      <span className="text-sm">Földrengések</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={showEarthquakes} 
                      onChange={() => {
                        setShowEarthquakes(!showEarthquakes);
                        if(showEarthquakes) setSelectedEq(null);
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-3">
                      <Layers className={`w-4 h-4 ${showPlates ? 'text-red-400' : 'text-slate-500'}`} />
                      <span className="text-sm">Tektonikus lemezek</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={showPlates} 
                      onChange={() => {
                        setShowPlates(!showPlates);
                        if(showPlates) setSelectedPlate(null);
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-3">
                      <Flame className={`w-4 h-4 ${showVolcanoes ? 'text-orange-400' : 'text-slate-500'}`} />
                      <span className="text-sm">Vulkánok</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={showVolcanoes} 
                      onChange={() => {
                        setShowVolcanoes(!showVolcanoes);
                        if(showVolcanoes) setSelectedVolcano(null);
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
               </div>
            </section>
          </div>

          <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl">
             <div className="flex gap-2 text-blue-400 mb-2">
                <Info className="w-4 h-4 shrink-0" />
                <h4 className="text-xs font-bold uppercase">Módszertani Segédlet</h4>
             </div>
             <p className="text-xs text-blue-200/80 leading-relaxed">
               Ez az alkalmazás segíti a diákokat a földrengések eloszlásának és a lemeztektonika összefüggéseinek megértésében. Használja az AI magyarázatot a tudományos mélység növeléséhez!
             </p>
          </div>
        </aside>

        {/* Center: Map */}
        <main className="flex-1 relative min-w-0">
          <EarthquakeMap 
            earthquakes={earthquakes}
            volcanoes={VOLCANOES}
            showEarthquakes={showEarthquakes}
            showPlates={showPlates}
            showVolcanoes={showVolcanoes}
            selectedEqId={selectedEq?.id || null}
            selectedPlateName={selectedPlate?.rawName || null}
            selectedVolcanoName={selectedVolcano?.name || null}
            onSelectEq={setSelectedEq}
            onSelectPlate={setSelectedPlate}
            onSelectVolcano={setSelectedVolcano}
            currentTimestamp={currentTimestamp}
          />
        </main>

        {/* Right Panel: Info + AI */}
        <aside className="w-96 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl h-full flex flex-col min-h-0">
            {(selectedEq || selectedPlate || selectedVolcano) ? (
              <div className="flex flex-col gap-6 h-full">
                <header>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedEq ? (
                      <>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedEq.mag >= 6 ? 'bg-red-500 text-white' : 'bg-yellow-500 text-slate-900'}`}>
                          M {selectedEq.mag.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{selectedEq.id}</span>
                      </>
                    ) : selectedPlate ? (
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">Kőzetlemez</span>
                    ) : (
                      <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">Vulkán</span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold leading-tight">
                    {selectedEq ? selectedEq.place : selectedPlate ? selectedPlate.name : selectedVolcano?.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedEq 
                      ? new Date(selectedEq.time).toLocaleString('hu-HU') 
                      : selectedPlate 
                        ? 'Tektonikus szerkezet' 
                        : `${selectedVolcano?.country} • ${selectedVolcano?.type}`}
                  </p>
                </header>

                {(selectedEq || selectedVolcano) && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedEq ? (
                      <>
                        <div className="p-3 bg-slate-800 rounded-lg flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Mélység</span>
                          <span className="font-semibold">{selectedEq.coordinates[2].toFixed(1)} km</span>
                        </div>
                        <div className="p-3 bg-slate-800 rounded-lg flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Típus</span>
                          <span className="font-semibold capitalize">{selectedEq.type}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-slate-800 rounded-lg flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Magasság</span>
                          <span className="font-semibold">{selectedVolcano?.elevation} m</span>
                        </div>
                        <div className="p-3 bg-slate-800 rounded-lg flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Koordináták</span>
                          <span className="font-semibold text-[10px] truncate">{selectedVolcano?.coordinates[1].toFixed(2)}, {selectedVolcano?.coordinates[0].toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                  <button
                    onClick={handleAiRequest}
                    disabled={isAiLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    {isAiLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <BrainCircuit className="w-5 h-5" />
                    )}
                    {selectedEq ? 'Tanári AI Magyarázat' : selectedPlate ? 'Lemez AI Elemzés' : 'Vulkán AI Magyarázat'}
                  </button>

                  {aiExplanation && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase">
                            <Info className="w-3.5 h-3.5" />
                            Összefoglaló
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${uncertaintyColor(aiExplanation.uncertainty)}`}>
                            {uncertaintyLabel(aiExplanation.uncertainty)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                          {aiExplanation.summaryHu}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-blue-400 flex items-center gap-2 uppercase">
                          <Waves className="w-3.5 h-3.5" />
                          Tudományos Értelmezés
                        </h4>
                        <div className="space-y-2">
                          {aiExplanation.scientificNotesHu.map((note, idx) => (
                            <div key={idx} className="flex gap-3 text-sm text-slate-400 bg-slate-800/30 p-3 rounded-lg border border-slate-800/50">
                              <span className="text-blue-500 font-bold">•</span>
                              <p className="leading-snug">{note}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-amber-500 flex items-center gap-2 uppercase">
                          <HelpCircle className="w-4 h-4" />
                          Osztálytermi Kérdés
                        </h4>
                        <p className="text-sm text-amber-200/90 italic font-medium">
                          "{aiExplanation.classroomQuestion}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                  <Activity className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-slate-200 font-bold uppercase tracking-wide text-sm">Nincs kijelölt esemény</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Válassz ki egy földrengést, kőzetlemezt vagy vulkánt a térképen az elemzés megkezdéséhez!
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom: Timeline Slider */}
      <footer className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-lg shadow-blue-500/20 transition-all shrink-0 active:scale-90"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
          </button>
          
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(timeLimits.min).toLocaleDateString('hu-HU')}</span>
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                <Calendar className="w-3 h-3 text-blue-400" />
                <span className="text-sm font-bold text-blue-100">
                  {new Date(currentTimestamp).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Most</span>
            </div>
            <input 
              type="range"
              min={timeLimits.min}
              max={timeLimits.max}
              value={currentTimestamp}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentTimestamp(parseInt(e.target.value));
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1 w-24">
             <label className="text-[10px] text-slate-500 font-bold uppercase text-center tracking-tighter">Sebesség</label>
             <div className="flex items-center justify-between gap-1 bg-slate-800 p-1 rounded-lg">
                {[1, 2, 5].map(speed => (
                  <button 
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${playbackSpeed === speed ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {speed}x
                  </button>
                ))}
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
