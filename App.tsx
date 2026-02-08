
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
  Minimize2,
  HelpCircle,
  ShieldAlert,
  Server,
  Scaling,
  Zap,
  Mountain,
  Globe,
  Compass,
  ArrowDownCircle,
  History
} from 'lucide-react';
import { Earthquake, TimeRange, Volcano, AIExplanation, Plate } from './types';
import { fetchEarthquakes } from './services/usgsService';
import { getAIExplanation, getPlateExplanation, getVolcanoExplanation } from './services/geminiService';
import EarthquakeMap from './components/EarthquakeMap';

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
    <div className="flex flex-col h-screen w-full p-4 gap-4 bg-slate-950">
      {/* Header */}
      <header className={`flex items-center justify-between px-2 transition-all duration-300 ${isFullscreen ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100 h-auto'}`}>
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full shadow-sm">
            <Activity className="w-3.5 h-3.5 text-yellow-400" />
            <span>{earthquakes.filter(e => e.time <= currentTimestamp).length} esemény</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left Panel: Controls */}
        <aside className={`flex flex-col gap-4 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${isFullscreen ? 'w-0 opacity-0 -translate-x-full pointer-events-none' : 'w-80 opacity-100 translate-x-0'}`}>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col gap-6 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              <Settings2 className="w-4 h-4 text-blue-400" />
              Beállítások
            </div>
            
            <section className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Időtartam</label>
                <div className="grid grid-cols-2 gap-2">
                  {[TimeRange.Day, TimeRange.Week, TimeRange.Month, TimeRange.Year].map(range => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                        timeRange === range 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                    >
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
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rétegek</label>
               <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${showEarthquakes ? 'bg-yellow-400/10' : 'bg-slate-800'}`}>
                        <Activity className={`w-3.5 h-3.5 ${showEarthquakes ? 'text-yellow-400' : 'text-slate-500'}`} />
                      </div>
                      <span className={`text-sm font-medium ${showEarthquakes ? 'text-slate-200' : 'text-slate-500'}`}>Földrengések</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={showEarthquakes} 
                      onChange={() => {
                        setShowEarthquakes(!showEarthquakes);
                        if(showEarthquakes) setSelectedEq(null);
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${showPlates ? 'bg-red-400/10' : 'bg-slate-800'}`}>
                        <Layers className={`w-3.5 h-3.5 ${showPlates ? 'text-red-400' : 'text-slate-500'}`} />
                      </div>
                      <span className={`text-sm font-medium ${showPlates ? 'text-slate-200' : 'text-slate-500'}`}>Tektonikus lemezek</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={showPlates} 
                      onChange={() => {
                        setShowPlates(!showPlates);
                        if(showPlates) setSelectedPlate(null);
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${showActiveVolcanoes ? 'bg-orange-500/10' : 'bg-slate-800'}`}>
                        <Zap className={`w-3.5 h-3.5 ${showActiveVolcanoes ? 'text-orange-500' : 'text-slate-500'}`} />
                      </div>
                      <span className={`text-sm font-medium ${showActiveVolcanoes ? 'text-slate-200' : 'text-slate-500'}`}>Aktív vulkánok</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={showActiveVolcanoes} 
                      onChange={() => {
                        setShowActiveVolcanoes(!showActiveVolcanoes);
                        if(showActiveVolcanoes) setSelectedVolcano(null);
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${showDormantVolcanoes ? 'bg-orange-300/10' : 'bg-slate-800'}`}>
                        <Flame className={`w-3.5 h-3.5 ${showDormantVolcanoes ? 'text-orange-300' : 'text-slate-500'}`} />
                      </div>
                      <span className={`text-sm font-medium ${showDormantVolcanoes ? 'text-slate-200' : 'text-slate-500'}`}>Alvó vulkánok</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={showDormantVolcanoes} 
                      onChange={() => {
                        setShowDormantVolcanoes(!showDormantVolcanoes);
                        if(showDormantVolcanoes) setSelectedVolcano(null);
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                    />
                  </label>
               </div>
            </section>
          </div>

          <div className="bg-blue-600/5 border border-blue-500/20 p-4 rounded-xl">
             <div className="flex gap-2 text-blue-400 mb-2">
                <Info className="w-4 h-4 shrink-0" />
                <h4 className="text-[10px] font-bold uppercase tracking-wider">Módszertani Segédlet</h4>
             </div>
             <p className="text-xs text-blue-200/60 leading-relaxed font-medium">
               Ez az alkalmazás segíti a diákokat a földrengések eloszlásának és a lemeztektonika összefüggéseinek megértésében. Használja az AI magyarázatot a tudományos mélység növeléséhez!
             </p>
          </div>
        </aside>

        {/* Center: Map */}
        <main className="flex-1 relative min-w-0 group">
          <EarthquakeMap 
            earthquakes={earthquakes}
            volcanoes={VOLCANOES}
            showEarthquakes={showEarthquakes}
            showPlates={showPlates}
            showActiveVolcanoes={showActiveVolcanoes}
            showDormantVolcanoes={showDormantVolcanoes}
            selectedEqId={selectedEq?.id || null}
            selectedPlateName={selectedPlate?.rawName || null}
            selectedVolcanoName={selectedVolcano?.name || null}
            onSelectEq={setSelectedEq}
            onSelectPlate={setSelectedPlate}
            onSelectVolcano={setSelectedVolcano}
            currentTimestamp={currentTimestamp}
          />
          {/* Fullscreen Toggle Button */}
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="absolute top-4 left-4 bg-slate-900/80 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700/50 text-slate-300 hover:text-white backdrop-blur shadow-lg transition-all z-10"
            title={isFullscreen ? "Kilépés a teljes képernyőből" : "Teljes képernyős térkép"}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </main>

        {/* Right Panel: Info + AI */}
        <aside className={`flex flex-col gap-4 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${isFullscreen ? 'w-0 opacity-0 translate-x-full pointer-events-none' : 'w-96 opacity-100 translate-x-0'}`}>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl h-full flex flex-col min-h-0 shadow-xl">
            {(selectedEq || selectedPlate || selectedVolcano) ? (
              <div className="flex flex-col gap-6 h-full">
                <header className="space-y-3">
                  <div className="flex items-center gap-2">
                    {selectedEq ? (
                      <>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${selectedEq.mag >= 6 ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-500/20'}`}>
                          M {selectedEq.mag.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded">{selectedEq.id}</span>
                      </>
                    ) : selectedPlate ? (
                      <span className="bg-red-600 text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-lg shadow-red-600/20">Kőzetlemez</span>
                    ) : (
                      <span className={`${selectedVolcano?.status === 'active' ? 'bg-red-600' : 'bg-orange-500'} text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-lg shadow-orange-500/20`}>
                        {selectedVolcano?.status === 'active' ? 'Aktív Vulkán' : 'Alvó Vulkán'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold leading-tight text-slate-100">
                      {selectedEq ? selectedEq.place : selectedPlate ? selectedPlate.name : selectedVolcano?.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2 font-medium">
                      {selectedEq && <Calendar className="w-3.5 h-3.5" />}
                      {selectedEq 
                        ? new Date(selectedEq.time).toLocaleString('hu-HU') 
                        : selectedPlate 
                          ? 'Tektonikus szerkezeti egység' 
                          : `${selectedVolcano?.country} • ${selectedVolcano?.type}`}
                    </p>
                  </div>
                </header>

                <div className="grid grid-cols-2 gap-3">
                  {selectedEq ? (
                    <>
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-black tracking-widest">
                          <ArrowDownCircle className="w-3 h-3 text-blue-400" />
                          Mélység
                        </div>
                        <span className="text-sm font-bold text-slate-200">{selectedEq.coordinates[2].toFixed(1)} km</span>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-black tracking-widest">
                          <Scaling className="w-3 h-3 text-yellow-400" />
                          Skála
                        </div>
                        <span className="text-sm font-bold text-slate-200 capitalize">{selectedEq.magType || 'Unknown'}</span>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-black tracking-widest">
                          <Server className="w-3 h-3 text-emerald-400" />
                          Forrás (Net)
                        </div>
                        <span className="text-sm font-bold text-slate-200 uppercase">{selectedEq.net}</span>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-black tracking-widest">
                          <ShieldAlert className="w-3 h-3 text-red-400" />
                          Cunami
                        </div>
                        <span className={`text-sm font-bold ${selectedEq.tsunami ? 'text-red-400' : 'text-slate-400'}`}>
                          {selectedEq.tsunami ? 'Veszély jelzett' : 'Nincs adat'}
                        </span>
                      </div>
                    </>
                  ) : selectedVolcano ? (
                    <>
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-black tracking-widest">
                          <Mountain className="w-3 h-3 text-orange-400" />
                          Magasság
                        </div>
                        <span className="text-sm font-bold text-slate-200">{selectedVolcano.elevation} m</span>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-black tracking-widest">
                          <Zap className="w-3 h-3 text-red-500" />
                          Utolsó kitörés
                        </div>
                        <span className="text-sm font-bold text-slate-200 truncate">{selectedVolcano.lastEruption || 'Nincs adat'}</span>
                      </div>
                      <div className="col-span-2 p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-black tracking-widest">
                          <History className="w-3 h-3 text-amber-400" />
                          Jelentős történelmi aktivitás
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedVolcano.notableEruptions?.map((year, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-700/50 rounded text-[10px] font-bold text-slate-300 border border-slate-700">
                              {year}
                            </span>
                          )) || <span className="text-xs text-slate-500">Nincs rögzített adat</span>}
                        </div>
                      </div>
                      <div className="col-span-2 p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-black tracking-widest">
                          <Globe className="w-3 h-3 text-blue-400" />
                          Ország & Koordináták
                        </div>
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {selectedVolcano.country} • {selectedVolcano.coordinates[1].toFixed(2)}°, {selectedVolcano.coordinates[0].toFixed(2)}°
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2 p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-black tracking-widest">
                          <Layers className="w-3 h-3 text-red-400" />
                          Lemezazonosító
                        </div>
                        <span className="text-sm font-bold text-slate-200">{selectedPlate?.rawName}</span>
                      </div>
                      <div className="col-span-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <p className="text-[11px] text-blue-200 leading-relaxed font-medium">
                          <Info className="w-3 h-3 inline mr-1.5 mb-0.5" />
                          Használd az AI elemzést a lemez típusának (óceáni/kontinentális) és a szomszédos határok jellegének meghatározásához.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                  <button
                    onClick={handleAiRequest}
                    disabled={isAiLoading}
                    className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-black shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
                  >
                    {isAiLoading ? (
                      <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <BrainCircuit className="w-5 h-5" />
                    )}
                    {selectedEq ? 'Tanári AI Magyarázat' : selectedPlate ? 'Lemez AI Elemzés' : 'Vulkán AI Magyarázat'}
                  </button>

                  {aiExplanation && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                            <Info className="w-3.5 h-3.5" />
                            Tanári Összefoglaló
                          </h4>
                          <div className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-tighter ${uncertaintyColor(aiExplanation.uncertainty)} shadow-sm`}>
                            {uncertaintyLabel(aiExplanation.uncertainty)}
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/40 p-5 rounded-2xl border border-slate-800 shadow-inner">
                          {aiExplanation.summaryHu}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase tracking-widest">
                          <Waves className="w-3.5 h-3.5" />
                          Tudományos Értelmezés
                        </h4>
                        <div className="space-y-2.5">
                          {aiExplanation.scientificNotesHu.map((note, idx) => (
                            <div key={idx} className="flex gap-3 text-sm text-slate-400 bg-slate-800/20 p-3.5 rounded-xl border border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                              <span className="text-blue-500 font-black mt-0.5">•</span>
                              <p className="leading-snug font-medium">{note}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl space-y-3 shadow-lg shadow-amber-500/5">
                        <h4 className="text-[10px] font-black text-amber-500 flex items-center gap-2 uppercase tracking-widest">
                          <HelpCircle className="w-4 h-4" />
                          Osztálytermi Kérdés
                        </h4>
                        <p className="text-sm text-amber-100/90 italic font-bold leading-relaxed">
                          "{aiExplanation.classroomQuestion}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-6 opacity-60">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700 shadow-inner">
                  <Activity className="w-10 h-10 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-slate-200 font-black uppercase tracking-widest text-xs">Nincs kijelölt esemény</h3>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed font-medium">
                    Válassz ki egy földrengést, kőzetlemezt vagy vulkánt a térképen a részletes tudományos elemzés megkezdéséhez!
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom: Timeline Slider */}
      <footer className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-14 h-14 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-xl shadow-blue-600/30 transition-all shrink-0 active:scale-90"
          >
            {isPlaying ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-1" />}
          </button>
          
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-end px-1">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Kezdet</span>
                <span className="text-xs font-bold text-slate-400">{new Date(timeLimits.min).toLocaleDateString('hu-HU')}</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 shadow-inner">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-sm font-black text-blue-100 tracking-tight">
                    {new Date(currentTimestamp).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Most</span>
                <span className="text-xs font-bold text-slate-400">{new Date(timeLimits.max).toLocaleDateString('hu-HU')}</span>
              </div>
            </div>
            <div className="relative group px-1">
              <input 
                type="range"
                min={timeLimits.min}
                max={timeLimits.max}
                value={currentTimestamp}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentTimestamp(parseInt(e.target.value));
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 w-28">
             <label className="text-[9px] text-slate-500 font-black uppercase text-center tracking-widest">Lejátszás</label>
             <div className="flex items-center justify-between gap-1 bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-700">
                {[1, 2, 5].map(speed => (
                  <button 
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${playbackSpeed === speed ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
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
