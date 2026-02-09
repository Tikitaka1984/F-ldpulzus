
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Activity, 
  Layers, 
  Flame, 
  Settings2, 
  Play, 
  Pause, 
  BrainCircuit,
  Calendar,
  Maximize2,
  Minimize2,
  HelpCircle,
  Zap,
  Mountain,
  BoxSelect
} from 'lucide-react';
import { Earthquake, TimeRange, Volcano, AIExplanation, Plate } from './types';
import { fetchEarthquakes } from './services/usgsService';
import { getAIExplanation, getPlateExplanation, getVolcanoExplanation } from './services/geminiService';
import EarthquakeMap from './components/EarthquakeMap';
import CrossSectionView from './components/CrossSectionView';

// Defined Selection type to fix TypeScript errors related to missing 'data' property on the built-in Selection type
type Selection = 
  | { type: 'earthquake'; data: Earthquake }
  | { type: 'plate'; data: Plate }
  | { type: 'volcano'; data: Volcano }
  | null;

const VOLCANOES: Volcano[] = [
  { name: 'Etna', country: 'Olaszország', coordinates: [14.99, 37.75], type: 'Stratovulkán', elevation: 3326, status: 'active', lastEruption: '2024', notableEruptions: ['1669', '1928', '1992', '2002'] },
  { name: 'Fuji', country: 'Japán', coordinates: [138.73, 35.36], type: 'Stratovulkán', elevation: 3776, status: 'dormant', lastEruption: '1707', notableEruptions: ['864', '1707'] },
  { name: 'Popocatépetl', country: 'Mexikó', coordinates: [-98.62, 19.02], type: 'Stratovulkán', elevation: 5426, status: 'active', lastEruption: '2024', notableEruptions: ['1994', '2000', '2013'] },
  { name: 'Vezúv', country: 'Olaszország', coordinates: [14.43, 40.82], type: 'Stratovulkán', elevation: 1281, status: 'dormant', lastEruption: '1944', notableEruptions: ['79 (Pompeii)', '1631', '1906', '1944'] },
  { name: 'Krakatoa', country: 'Indonézia', coordinates: [105.42, -6.10], type: 'Kaldera', elevation: 813, status: 'active', lastEruption: '2023', notableEruptions: ['1883', '2018'] },
  { name: 'Kilauea', country: 'Hawaii, USA', coordinates: [-155.28, 19.42], type: 'Pajzsvulkán', elevation: 1247, status: 'active', lastEruption: '2024', notableEruptions: ['1790', '1924', '1983-2018', '2021'] },
  { name: 'Szent Helens', country: 'USA', coordinates: [-122.19, 46.19], type: 'Stratovulkán', elevation: 2549, status: 'dormant', lastEruption: '2008', notableEruptions: ['1980'] },
  { name: 'Merapi', country: 'Indonézia', coordinates: [110.44, -7.54], type: 'Stratovulkán', elevation: 2930, status: 'active', lastEruption: '2024', notableEruptions: ['1006', '1930', '2010'] },
  { name: 'Cotopaxi', country: 'Ecuador', coordinates: [-78.43, -0.68], type: 'Stratovulkán', elevation: 5897, status: 'active', lastEruption: '2023', notableEruptions: ['1744', '1768', '1877', '2015'] },
  { name: 'Mauna Loa', country: 'Hawaii, USA', coordinates: [-155.59, 19.47], type: 'Pajzsvulkán', elevation: 4169, status: 'active', lastEruption: '2022', notableEruptions: ['1950', '1984', '2022'] },
  { name: 'Mount Rainier', country: 'USA', coordinates: [-121.76, 46.85], type: 'Stratovulkán', elevation: 4392, status: 'dormant', lastEruption: '1894', notableEruptions: ['~1000 éve'] },
  { name: 'Pinatubo', country: 'Fülöp-szigetek', coordinates: [120.35, 15.14], type: 'Stratovulkán', elevation: 1486, status: 'dormant', lastEruption: '1993', notableEruptions: ['1991'] },
  { name: 'Eyjafjallajökull', country: 'Izland', coordinates: [-19.62, 63.63], type: 'Stratovulkán', elevation: 1651, status: 'dormant', lastEruption: '2010', notableEruptions: ['1821', '2010'] },
  { name: 'Nevado del Ruiz', country: 'Kolumbia', coordinates: [-75.32, 4.89], type: 'Stratovulkán', elevation: 5321, status: 'active', lastEruption: '2023', notableEruptions: ['1595', '1845', '1985'] },
  { name: 'Yasur', country: 'Vanuatu', coordinates: [169.45, -19.53], type: 'Sztratovulkán', elevation: 361, status: 'active', lastEruption: 'Folyamatos', notableEruptions: ['Folyamatosan aktív ~800 éve'] },
  { name: 'Bromo', country: 'Indonézia', coordinates: [112.94, -7.94], type: 'Salakkúp', elevation: 2329, status: 'active', lastEruption: '2019', notableEruptions: ['2010', '2015'] },
  { name: 'Stromboli', country: 'Olaszország', coordinates: [15.21, 38.79], type: 'Stratovulkán', elevation: 924, status: 'active', lastEruption: 'Folyamatos', notableEruptions: ['Folyamatosan aktív ~2000 éve'] },
  { name: 'Mayon', country: 'Fülöp-szigetek', coordinates: [123.68, 13.25], type: 'Stratovulkán', elevation: 2462, status: 'active', lastEruption: '2023', notableEruptions: ['1814', '1897', '1984', '2018'] },
  { name: 'Szantorin', country: 'Görögország', coordinates: [25.40, 36.40], type: 'Kaldera', elevation: 367, status: 'dormant', lastEruption: '1950', notableEruptions: ['Minooszi kitörés (Kr.e. 1600 körül)'] },
  { name: 'Mount Ararat', country: 'Törökország', coordinates: [44.29, 39.70], type: 'Rétegvulkán', elevation: 5137, status: 'dormant', lastEruption: '1840', notableEruptions: ['1840'] },
];

const App: React.FC = () => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [minMagnitude, setMinMagnitude] = useState(4.0);
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.Week);
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showPlates, setShowPlates] = useState(true);
  const [showActiveVolcanoes, setShowActiveVolcanoes] = useState(true);
  const [showDormantVolcanoes, setShowDormantVolcanoes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [selection, setSelection] = useState<Selection>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(Date.now());
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchEarthquakes(timeRange, minMagnitude);
      setEarthquakes(data);
      if (data.length > 0 && !isPlaying) {
          const sorted = [...data].sort((a, b) => a.time - b.time);
          setCurrentTimestamp(sorted[sorted.length - 1].time);
      }
    };
    loadData();
  }, [timeRange, minMagnitude, isPlaying]);

  useEffect(() => {
    let interval: number | undefined;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCurrentTimestamp(prev => {
          const step = 3600000 * 6 * playbackSpeed;
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
    if (!selection) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setAiExplanation(null);
    setIsAiLoading(true);

    try {
      let result: AIExplanation;
      if (selection.type === 'earthquake') {
        result = await getAIExplanation(selection.data);
      } else if (selection.type === 'plate') {
        result = await getPlateExplanation(selection.data);
      } else if (selection.type === 'volcano') {
        result = await getVolcanoExplanation(selection.data);
      } else {
        throw new Error("Típus hiba");
      }
      
      if (!signal.aborted) {
        setAiExplanation(result);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("AI hiba:", err);
    } finally {
      if (!signal.aborted) {
        setIsAiLoading(false);
      }
    }
  };

  useEffect(() => {
    setAiExplanation(null);
    setIsAiLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [selection]);

  const timeLimits = useMemo(() => {
    if (earthquakes.length === 0) return { min: Date.now() - 604800000, max: Date.now() };
    const sorted = [...earthquakes].sort((a, b) => a.time - b.time);
    return { min: sorted[0].time, max: Date.now() };
  }, [earthquakes]);

  const handleSelectEq = useCallback((eq: Earthquake | null) => {
    setSelection(eq ? { type: 'earthquake', data: eq } : null);
  }, []);

  const handleSelectPlate = useCallback((p: Plate | null) => {
    setSelection(p ? { type: 'plate', data: p } : null);
  }, []);

  const handleSelectVolcano = useCallback((v: Volcano | null) => {
    console.log('App: Vulkán kiválasztva:', v?.name);
    setSelection(v ? { type: 'volcano', data: v } : null);
  }, []);

  const uncertaintyColor = (level: string) => {
    switch(level) {
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const renderAiResult = () => {
    if (!aiExplanation) return null;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 mt-6 pt-6 border-t border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Tanári Összefoglaló</h4>
            <div className={`text-[9px] px-2 py-0.5 rounded-full border font-black ${uncertaintyColor(aiExplanation.uncertainty)}`}>{aiExplanation.uncertainty} bizonytalanság</div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/40 p-4 rounded-xl border border-slate-800">{aiExplanation.summaryHu}</p>
        </div>
        <div className="space-y-2">
          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Tudományos Megállapítások</h4>
          <div className="space-y-2">{aiExplanation.scientificNotesHu.map((note, idx) => (
            <div key={idx} className="flex gap-2 text-sm text-slate-400 bg-slate-800/20 p-3 rounded-lg border border-slate-800/40"><span className="text-blue-500 font-black">•</span><p className="leading-snug">{note}</p></div>
          ))}</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-2">
          <h4 className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-2"><HelpCircle className="w-3.5 h-3.5" />Osztálytermi Kérdés</h4>
          <p className="text-sm text-amber-100/90 italic font-bold">"{aiExplanation.classroomQuestion}"</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 gap-4 bg-slate-950 overflow-hidden text-slate-100 font-sans">
      <header className={`flex items-center justify-between px-2 transition-all duration-300 shrink-0 ${isFullscreen ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100 h-auto mb-2'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">Earth Pulse Map</h1>
            <p className="text-xs text-slate-400 font-medium">Tanári Segéd • <span className="text-blue-400">Középiskolai Földrajz</span></p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>{new Date(currentTimestamp).toLocaleDateString('hu-HU')}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Settings */}
        <aside className={`flex flex-col gap-4 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${isFullscreen ? 'w-0 opacity-0 -translate-x-full pointer-events-none' : 'w-80 opacity-100 translate-x-0 shrink-0'}`}>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col gap-6 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              <Settings2 className="w-4 h-4 text-blue-400" /> Beállítások
            </div>
            <section className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Időtartam</label>
                <div className="grid grid-cols-2 gap-2">
                  {[TimeRange.Day, TimeRange.Week, TimeRange.Month, TimeRange.Year].map(range => (
                    <button key={range} onClick={() => setTimeRange(range)} className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${timeRange === range ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'}`}>
                      {range === TimeRange.Day ? 'Nap' : range === TimeRange.Week ? 'Hét' : range === TimeRange.Month ? 'Hónap' : 'Év'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Min. Magnitúdó</label>
                  <span className="text-xs font-mono text-blue-400 font-bold bg-blue-400/10 px-1.5 py-0.5 rounded">{minMagnitude.toFixed(1)}</span>
                </div>
                <input type="range" min="3.0" max="7.0" step="0.1" value={minMagnitude} onChange={(e) => setMinMagnitude(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
            </section>
            <section className="space-y-3 pt-4 border-t border-slate-800">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rétegek</label>
               <div className="space-y-1.5">
                  {[
                    { label: 'Földrengések', icon: Activity, state: showEarthquakes, set: setShowEarthquakes, color: 'text-yellow-400' },
                    { label: 'Tektonikus lemezek', icon: Layers, state: showPlates, set: setShowPlates, color: 'text-red-400' },
                    { label: 'Aktív vulkánok', icon: Zap, state: showActiveVolcanoes, set: setShowActiveVolcanoes, color: 'text-orange-500' },
                    { label: 'Aktív/Alvó vulkánok', icon: Flame, state: showDormantVolcanoes, set: setShowDormantVolcanoes, color: 'text-orange-300' }
                  ].map((layer, i) => (
                    <label key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${layer.state ? 'bg-slate-800' : 'bg-slate-800/20'}`}>
                          <layer.icon className={`w-3.5 h-3.5 ${layer.state ? layer.color : 'text-slate-500'}`} />
                        </div>
                        <span className={`text-sm font-medium ${layer.state ? 'text-slate-200' : 'text-slate-500'}`}>{layer.label}</span>
                      </div>
                      <input type="checkbox" checked={layer.state} onChange={() => layer.set(!layer.state)} className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600" />
                    </label>
                  ))}
               </div>
            </section>
          </div>
        </aside>

        {/* Map Container */}
        <main className="flex-1 relative min-w-0 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
          <EarthquakeMap 
            earthquakes={earthquakes} volcanoes={VOLCANOES}
            showEarthquakes={showEarthquakes} showPlates={showPlates}
            showActiveVolcanoes={showActiveVolcanoes} showDormantVolcanoes={showDormantVolcanoes}
            selectedEqId={selection?.type === 'earthquake' ? selection.data.id : null}
            selectedPlateName={selection?.type === 'plate' ? selection.data.rawName : null}
            selectedVolcanoName={selection?.type === 'volcano' ? selection.data.name : null}
            onSelectEq={handleSelectEq}
            onSelectPlate={handleSelectPlate}
            onSelectVolcano={handleSelectVolcano}
            currentTimestamp={currentTimestamp}
          />
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="absolute top-4 left-4 bg-slate-900/80 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700/50 text-slate-300 z-10 transition-all shadow-lg">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </main>

        {/* Details Panel */}
        <aside className={`flex flex-col transition-all duration-300 ease-in-out shrink-0 min-w-[384px] bg-slate-950 ${isFullscreen ? 'w-0 opacity-0 translate-x-full pointer-events-none' : 'w-96 opacity-100 translate-x-0'}`}>
          <div className="bg-slate-900 border border-slate-800 rounded-xl h-full flex flex-col shadow-2xl overflow-y-auto custom-scrollbar p-6">
            {selection ? (
              <div key={`${selection.type}-${(selection.data as any).id || (selection.data as any).name}`} className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex-1 space-y-6">
                  {selection.type === 'earthquake' && (
                    <div className="space-y-4">
                      <header className="space-y-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${selection.data.mag >= 6 ? 'bg-red-600' : 'bg-yellow-500'} text-white w-fit block`}>
                          Földrengés • M {selection.data.mag.toFixed(1)}
                        </span>
                        <h2 className="text-xl font-bold leading-tight text-slate-100 tracking-tight">{selection.data.place}</h2>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                          <Calendar className="w-3.5 h-3.5" />{new Date(selection.data.time).toLocaleString('hu-HU')}
                        </div>
                      </header>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800/60 flex flex-col gap-1">
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Mélység</span>
                          <span className="text-sm font-bold text-slate-200">{selection.data.coordinates[2].toFixed(1)} km</span>
                        </div>
                        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800/60 flex flex-col gap-1">
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Skála</span>
                          <span className="text-sm font-bold text-slate-200 uppercase">{selection.data.magType || 'USGS'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selection.type === 'plate' && (
                    <div className="space-y-4">
                      <header className="space-y-3">
                        <span className="bg-red-600 text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider w-fit block">Kőzetlemez</span>
                        <h2 className="text-xl font-bold leading-tight text-slate-100 tracking-tight">{selection.data.name}</h2>
                        <p className="text-xs text-slate-400 font-medium italic">Tektonikus szerkezeti egység</p>
                      </header>
                      <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800/60 flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Lemezazonosító</span>
                        <span className="text-sm font-bold text-slate-200">{selection.data.rawName}</span>
                      </div>
                    </div>
                  )}

                  {selection.type === 'volcano' && (
                    <div className="space-y-4">
                      <header className="space-y-3">
                        <span className="bg-red-600 text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider w-fit block shadow-md shadow-red-900/50">
                          VULKÁN
                        </span>
                        <h2 className="text-xl font-bold leading-tight text-slate-100 tracking-tight">{selection.data.name}</h2>
                        <p className="text-xs text-slate-400 font-medium">{selection.data.country} • {selection.data.type}</p>
                      </header>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800/60 flex flex-col gap-1">
                          <div className="flex items-center gap-2"><Mountain className="w-3 h-3 text-orange-400" /><span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Magasság</span></div>
                          <span className="text-sm font-bold text-slate-200">{selection.data.elevation} m</span>
                        </div>
                        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800/60 flex flex-col gap-1">
                          <div className="flex items-center gap-2"><Zap className="w-3 h-3 text-red-400" /><span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Státusz</span></div>
                          <span className={`text-sm font-bold uppercase tracking-wide ${selection.data.status === 'active' ? 'text-red-500' : 'text-orange-400'}`}>
                            {selection.data.status === 'active' ? 'AKTÍV' : 'ALVÓ'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-4">
                    <button onClick={() => setIsSectionOpen(true)} className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-xl text-xs font-black text-blue-400 transition-all shadow-sm">
                      <BoxSelect className="w-4 h-4" /> MÉLYSZELVÉNY MEGTEKINTÉSE
                    </button>
                    <button 
                      onClick={handleAiRequest} 
                      disabled={isAiLoading} 
                      className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-50 rounded-xl text-sm font-black shadow-xl transition-all active:scale-[0.98]"
                    >
                      {isAiLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <BrainCircuit className="w-5 h-5" />} Tanári AI Magyarázat
                    </button>
                  </div>
                  
                  {renderAiResult()}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-6 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-slate-800/40 rounded-full flex items-center justify-center border border-slate-700/50 shadow-inner">
                  <Activity className="w-10 h-10 text-slate-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-slate-200 font-black uppercase tracking-widest text-xs">Nincs kijelölt esemény</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-[200px] leading-relaxed text-balance">
                    Kattints egy földrengésre, vulkánra vagy kőzetlemezre a térképen a részletekért!
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {isSectionOpen && <CrossSectionView item={selection ? selection.data : null} onClose={() => setIsSectionOpen(false)} />}

      <footer className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-xl active:scale-90 transition-all shrink-0">
            {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
          </button>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{new Date(timeLimits.min).toLocaleDateString('hu-HU')}</span>
              <span className="text-xs font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full shadow-sm">{new Date(currentTimestamp).toLocaleString('hu-HU')}</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Ma</span>
            </div>
            <input type="range" min={timeLimits.min} max={timeLimits.max} value={currentTimestamp} onChange={(e) => { setIsPlaying(false); setCurrentTimestamp(parseInt(e.target.value)); }} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
          <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/30">
            {[1, 2, 5].map(speed => (
              <button key={speed} onClick={() => setPlaybackSpeed(speed)} className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all ${playbackSpeed === speed ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{speed}x</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
