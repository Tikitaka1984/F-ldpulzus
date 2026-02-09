import React, { useEffect, useRef, useMemo } from 'react';
import { 
  select, 
  geoNaturalEarth1, 
  geoPath, 
  json, 
  zoom, 
  symbol, 
  symbolTriangle 
} from 'd3';
import { feature } from 'topojson-client';
import { Earthquake, Volcano, Plate } from '../types';

interface EarthquakeMapProps {
  earthquakes: Earthquake[];
  volcanoes: Volcano[];
  showEarthquakes: boolean;
  showPlates: boolean;
  showActiveVolcanoes: boolean;
  showDormantVolcanoes: boolean;
  selectedEqId: string | null;
  selectedPlateName: string | null;
  selectedVolcanoName: string | null;
  onSelectEq: (eq: Earthquake | null) => void;
  onSelectPlate: (plate: Plate | null) => void;
  onSelectVolcano: (volcano: Volcano | null) => void;
  currentTimestamp: number;
}

const PLATE_NAMES_HU: Record<string, string> = {
  "Pacific Plate": "Csendes-óceáni-lemez",
  "North American Plate": "Észak-amerikai-lemez",
  "Eurasian Plate": "Eurázsiai-lemez",
  "African Plate": "Afrikai-lemez",
  "Antarctic Plate": "Antarktiszi-lemez",
  "Indo-Australian Plate": "Indo-ausztrál-lemez",
  "South American Plate": "Dél-amerikai-lemez",
  "Nazca Plate": "Nazca-lemez",
  "Philippine Sea Plate": "Filippínó-lemez",
  "Arabian Plate": "Arab-lemez",
  "Caribbean Plate": "Karibi-lemez",
  "Cocos Plate": "Ccocos-lemez",
  "Scotia Plate": "Scotia-lemez",
  "Juan de Fuca Plate": "Juan de Fuca-lemez",
  "Somali Plate": "Szomáli-lemez",
  "Amur Plate": "Amuri-lemez",
  "Okhotsk Plate": "Ohotszki-lemez",
  "Sunda Plate": "Szunda-lemez",
  "Yangtze Plate": "Jangce-lemez",
  "Australian Plate": "Ausztrál-lemez",
  "Indian Plate": "Indiai-lemez",
  "Burma Plate": "Burmai-lemez",
  "New Hebrides Plate": "Új-Hebridák-lemez",
  "Solomon Sea Plate": "Salamon-tengeri-lemez",
  "Bismarck Plate": "Bismarck-lemez",
  "Caroline Plate": "Karolina-lemez",
  "Mariana Plate": "Mariana-lemez",
  "Adriatic Plate": "Adriai-lemez",
  "Aegean Sea Plate": "Égei-tengeri-lemez",
  "Anatolian Plate": "Anatóliai-lemez",
  "Sandwich Plate": "Sandwich-lemez",
  "Easter Plate": "Húsvét-szigeti-lemez",
  "Galapagos Plate": "Galápagos-lemez",
  "Juan Fernandez Plate": "Juan Fernández-lemez",
  "Kermadec Plate": "Kermadec-lemez",
  "Manus Plate": "Manus-lemez",
  "Maoke Plate": "Maoke-lemez",
  "Molukka Sea Plate": "Molukka-tengeri-lemez",
  "Niuafo'ou Plate": "Niuafo'ou-lemez",
  "North Bismarck Plate": "Észak-Bismarck-lemez",
  "North Galapagos Plate": "Észak-Galápagos-lemez",
  "Okinawa Plate": "Okinava-lemez",
  "Panama Plate": "Panama-lemez",
  "Rivera Plate": "Rivera-lemez",
  "South Bismarck Plate": "Dél-Bismarck-lemez",
  "South Sandwich Plate": "Dél-Sandwich-lemez",
  "Tonga Plate": "Tonga-lemez",
  "Woodlark Plate": "Woodlark-lemez"
};

const EarthquakeMap: React.FC<EarthquakeMapProps> = ({
  earthquakes,
  volcanoes,
  showEarthquakes,
  showPlates,
  showActiveVolcanoes,
  showDormantVolcanoes,
  selectedEqId,
  selectedPlateName,
  selectedVolcanoName,
  onSelectEq,
  onSelectPlate,
  onSelectVolcano,
  currentTimestamp
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const projection = useMemo(() => 
    geoNaturalEarth1()
      .scale(160)
      .translate([450, 250])
  , []);

  const path = geoPath().projection(projection);

  // Initialize Map Layers and Defs
  useEffect(() => {
    if (!svgRef.current) return;

    const svgElement = select(svgRef.current);
    const gMain = select(gRef.current);

    svgElement.selectAll('defs').remove();
    const defs = svgElement.append('defs');
    
    // Background click logic - clicks on ocean/empty space clears selection
    svgElement.on('click', (event) => {
      const target = event.target as SVGElement;
      if (target === svgRef.current) {
        onSelectEq(null);
        onSelectPlate(null);
        onSelectVolcano(null);
      }
    });

    // Create Layers explicitly for z-indexing
    if (gMain.select('.base-layer').empty()) {
        gMain.append('g').attr('class', 'base-layer');
        gMain.append('g').attr('class', 'plates-layer');
        gMain.append('g').attr('class', 'earthquakes-layer');
        gMain.append('g').attr('class', 'volcanoes-layer');
    }

    const glowFilter = defs.append('filter')
      .attr('id', 'active-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'blur');
    glowFilter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    const ringPulse = defs.append('radialGradient')
      .attr('id', 'ring-pulse')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    ringPulse.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.6);
    ringPulse.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0);

    // Initial country render
    const gBase = gMain.select('.base-layer');
    if (gBase.selectAll('.country').empty()) {
      json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((data: any) => {
        const countries = feature(data, data.objects.countries);
        gBase.selectAll('.country')
          .data((countries as any).features)
          .enter()
          .append('path')
          .attr('class', 'country')
          .attr('d', path as any)
          .attr('fill', '#1e293b')
          .attr('stroke', '#334155')
          .attr('stroke-width', 0.5)
          .on('click', (event) => {
             // Clicking a country also clears unless stopped by marker
             onSelectEq(null);
             onSelectPlate(null);
             onSelectVolcano(null);
          });
      });
    }

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .on('zoom', (event) => {
        gMain.attr('transform', event.transform);
        const k = event.transform.k;
        gMain.selectAll('.plate-label').style('font-size', `${10 / k}px`);
        gMain.selectAll('.eq-dot').attr('stroke-width', 1 / k);
        gMain.selectAll('.volcano-symbol').attr('stroke-width', 1.5 / k);
        gMain.selectAll('.volcano-hitbox').attr('r', 18 / k);
      });

    svgElement.call(zoomBehavior);

    const refreshAllTransforms = () => {
      gMain.selectAll('.eq-group')
        .attr('transform', (d: any) => {
          const coords = projection(d.coordinates as [number, number]);
          return coords ? `translate(${coords[0]}, ${coords[1]})` : null;
        });
      gMain.selectAll('.volcano-group')
        .attr('transform', (d: any) => {
          const coords = projection(d.coordinates);
          return coords ? `translate(${coords[0]}, ${coords[1]})` : null;
        });
      gMain.selectAll('.plate-label')
        .attr('transform', (d: any) => {
          const c = path.centroid(d);
          return isNaN(c[0]) ? 'translate(0,0)' : `translate(${c[0]}, ${c[1]})`;
        });
    };

    const handleResize = () => {
      if (containerRef.current && svgRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        projection.translate([width / 2, height / 2]);
        gMain.selectAll('path').attr('d', path as any);
        refreshAllTransforms();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [path, projection, onSelectEq, onSelectPlate, onSelectVolcano]);

  const showTooltip = (content: string, event: any) => {
    if (!tooltipRef.current) return;
    select(tooltipRef.current)
      .style('opacity', 1)
      .html(content)
      .style('left', (event.pageX + 15) + 'px')
      .style('top', (event.pageY - 20) + 'px');
  };

  const hideTooltip = () => {
    if (!tooltipRef.current) return;
    select(tooltipRef.current).style('opacity', 0);
  };

  // Plates Effect
  useEffect(() => {
    const gLayer = select(gRef.current).select('.plates-layer');
    if (showPlates) {
       json('https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json').then((data: any) => {
        const features = (data as any).features;
        const plates = gLayer.selectAll('.plate-boundary').data(features, (d: any) => d.properties.PlateName || d.properties.LAYER);

        plates.enter()
          .append('path').attr('class', 'plate-boundary cursor-pointer transition-colors duration-200')
          .merge(plates as any).attr('d', path as any)
          .attr('fill', (d: any) => (d.properties.PlateName || d.properties.LAYER) === selectedPlateName ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.04)')
          .attr('stroke', (d: any) => (d.properties.PlateName || d.properties.LAYER) === selectedPlateName ? '#ef4444' : '#f87171')
          .attr('stroke-width', (d: any) => (d.properties.PlateName || d.properties.LAYER) === selectedPlateName ? 1.8 : 0.6)
          .on('mouseover', function(event, d: any) {
            const rawName = d.properties.PlateName || d.properties.LAYER || "";
            select(this).attr('fill', 'rgba(239, 68, 68, 0.3)');
            showTooltip(`<div class="font-bold text-red-400">${PLATE_NAMES_HU[rawName] || rawName}</div><div class="text-[10px] text-slate-400 uppercase font-black">Kőzetlemez</div>`, event);
          })
          .on('mouseout', function(event, d: any) {
            select(this).attr('fill', (d.properties.PlateName || d.properties.LAYER) === selectedPlateName ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.04)');
            hideTooltip();
          })
          .on('click', (event, d: any) => {
            event.stopPropagation();
            const rawName = d.properties.PlateName || d.properties.LAYER || "";
            onSelectPlate({ name: PLATE_NAMES_HU[rawName] || rawName, rawName, feature: d });
          });

        const labels = gLayer.selectAll('.plate-label').data(features, (d: any) => d.properties.PlateName || d.properties.LAYER);
        labels.enter().append('text').attr('class', 'plate-label').merge(labels as any)
          .attr('transform', (d: any) => { const c = path.centroid(d); return isNaN(c[0]) ? 'translate(0,0)' : `translate(${c[0]}, ${c[1]})`; })
          .text((d: any) => PLATE_NAMES_HU[d.properties.PlateName || d.properties.LAYER] || d.properties.PlateName || d.properties.LAYER)
          .attr('text-anchor', 'middle').attr('fill', (d: any) => (d.properties.PlateName || d.properties.LAYER) === selectedPlateName ? '#fff' : '#f87171')
          .style('font-size', '10px').style('font-weight', '700').style('text-transform', 'uppercase').style('pointer-events', 'none').style('opacity', 0.8).style('text-shadow', '0 0 4px #000');
          
        plates.exit().remove(); labels.exit().remove();
      });
    } else {
      gLayer.selectAll('.plate-boundary').remove(); gLayer.selectAll('.plate-label').remove();
    }
  }, [showPlates, path, selectedPlateName, onSelectPlate]);

  // Earthquakes Effect
  useEffect(() => {
    const gLayer = select(gRef.current).select('.earthquakes-layer');
    if (showEarthquakes) {
      const filteredEqs = earthquakes.filter(eq => eq.time <= currentTimestamp);
      const groups = gLayer.selectAll('.eq-group').data(filteredEqs, (d: any) => d.id);
      
      groups.exit().remove();
      
      const groupsEnter = groups.enter().append('g').attr('class', 'eq-group');
      groupsEnter.append('circle').attr('class', 'selection-pulse').attr('r', 0).attr('fill', 'url(#ring-pulse)').style('pointer-events', 'none').style('opacity', 0);
      groupsEnter.append('circle').attr('class', 'eq-dot cursor-pointer transition-all duration-300')
        .on('mouseover', function(event, d: any) {
          select(this).attr('stroke', '#fff').attr('stroke-width', 2);
          showTooltip(`<div class="flex flex-col gap-1"><div class="flex items-center gap-2"><span class="px-1.5 py-0.5 rounded bg-yellow-500 text-slate-900 text-[10px] font-black">M ${d.mag.toFixed(1)}</span><span class="font-bold text-slate-100">${d.place}</span></div><div class="text-[9px] text-slate-400 uppercase tracking-widest font-black">${new Date(d.time).toLocaleDateString('hu-HU')}</div></div>`, event);
        })
        .on('mouseout', function(event, d: any) { 
          select(this).attr('stroke', d.id === selectedEqId ? '#fff' : 'none').attr('stroke-width', 1);
          hideTooltip(); 
        })
        .on('click', (event, d: any) => { 
          event.stopPropagation(); 
          onSelectEq(d);
        });

      const groupsMerge = groupsEnter.merge(groups as any);
      groupsMerge.attr('transform', (d: any) => {
        const coords = projection(d.coordinates as [number, number]);
        return coords ? `translate(${coords[0]}, ${coords[1]})` : null;
      });
      
      groupsMerge.select('.eq-dot')
        .attr('r', (d: any) => Math.max(2, (d.mag - 2) * 2))
        .attr('fill', (d: any) => d.id === selectedEqId ? '#3b82f6' : d.mag > 6 ? '#ef4444' : '#f59e0b')
        .attr('fill-opacity', 0.7)
        .attr('stroke', (d: any) => d.id === selectedEqId ? '#fff' : 'none');

      groupsMerge.select('.selection-pulse')
        .transition().duration(1000)
        .attr('r', (d: any) => d.id === selectedEqId ? 25 : 0)
        .style('opacity', (d: any) => d.id === selectedEqId ? 1 : 0);
    } else {
      gLayer.selectAll('.eq-group').remove();
    }
  }, [earthquakes, currentTimestamp, projection, selectedEqId, showEarthquakes, onSelectEq]);

  // Volcanoes Effect - REWRITTEN FOR MAXIMUM RELIABILITY
  useEffect(() => {
    const gLayer = select(gRef.current).select('.volcanoes-layer');
    if (gLayer.empty()) return;

    const visibleVolcanoes = volcanoes.filter(v => 
      (v.status === 'active' && showActiveVolcanoes) || 
      (v.status === 'dormant' && showDormantVolcanoes)
    );
    
    console.log('🌋 Rendering volcanoes:', { showActive: showActiveVolcanoes, showDormant: showDormantVolcanoes, count: visibleVolcanoes.length });

    const volcs = gLayer.selectAll<SVGGElement, Volcano>('.volcano-group')
      .data(visibleVolcanoes, (d: Volcano) => d.name);
    
    // Remove old markers
    volcs.exit().remove();

    // Create new marker groups
    const volcsEnter = volcs.enter()
      .append('g')
      .attr('class', 'volcano-group cursor-pointer')
      .style('pointer-events', 'auto');

    // ADD INVISIBLE HITBOX for better clickability - ensure it has fill to be clickable
    volcsEnter.append('circle')
      .attr('class', 'volcano-hitbox')
      .attr('r', 18)
      .attr('fill', 'rgba(255, 255, 255, 0)') // Fully transparent but present
      .style('pointer-events', 'auto');

    // Add the visual symbol
    volcsEnter.append('path')
      .attr('class', 'volcano-symbol')
      .attr('d', symbol().type(symbolTriangle).size(220) as any)
      .style('transform-origin', 'center')
      .style('pointer-events', 'none');

    // Merge and update all markers
    const volcsMerge = volcsEnter.merge(volcs);
    
    volcsMerge
      .attr('transform', (d: Volcano) => {
        const coords = projection(d.coordinates);
        return coords ? `translate(${coords[0]}, ${coords[1]})` : null;
      })
      .on('click', function(event, d: Volcano) {
        event.stopPropagation();
        event.preventDefault();
        console.log('🌋 VULKÁN KATTINTVA:', d.name, d);
        onSelectVolcano(d);
      });

    // Update visuals based on selection state
    volcsMerge.select('.volcano-symbol')
      .attr('fill', (d: Volcano) => d.name === selectedVolcanoName ? '#fff' : d.status === 'active' ? '#ef4444' : '#fdba74')
      .attr('stroke', (d: Volcano) => d.name === selectedVolcanoName ? '#3b82f6' : d.status === 'active' ? '#fecaca' : 'none')
      .attr('stroke-width', (d: Volcano) => d.name === selectedVolcanoName ? 3 : 1.5)
      .style('filter', (d: Volcano) => d.status === 'active' ? 'url(#active-glow)' : 'none')
      .style('opacity', (d: Volcano) => d.name === selectedVolcanoName ? 1 : 0.95);

    // Hover effects
    volcsMerge.on('mouseover', function(event, d: Volcano) {
      select(this).select('.volcano-symbol').transition().duration(200).attr('transform', 'scale(1.4)');
      showTooltip(`<div class="flex flex-col gap-1"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${d.status === 'active' ? 'bg-red-500 animate-pulse' : 'bg-orange-300'}"></span><span class="font-black text-slate-100">${d.name}</span></div><div class="text-[10px] text-slate-400 font-black uppercase tracking-widest">${d.country} • ${d.type}</div></div>`, event);
    })
    .on('mouseout', function(event, d: Volcano) {
      select(this).select('.volcano-symbol').transition().duration(200).attr('transform', 'scale(1)');
      hideTooltip();
    });

    console.log('🌋 Volcano SVG markers updated:', gLayer.selectAll('.volcano-group').size());

  }, [showActiveVolcanoes, showDormantVolcanoes, volcanoes, projection, selectedVolcanoName, onSelectVolcano]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-950">
      <svg ref={svgRef} className="w-full h-full pointer-events-auto block">
        <g ref={gRef}></g>
      </svg>
      <div ref={tooltipRef} className="fixed pointer-events-none bg-slate-900/95 border border-slate-700/50 p-3 rounded-xl shadow-2xl backdrop-blur-md opacity-0 transition-opacity duration-200 z-50 min-w-[150px]" style={{ transform: 'translate(-50%, -100%)' }}></div>
      <div className="absolute top-4 right-4 bg-slate-900/90 p-4 rounded-xl border border-slate-700 text-[10px] backdrop-blur-lg pointer-events-none space-y-3 shadow-xl z-20">
        <div className="space-y-2">
          <div className="text-slate-500 font-black uppercase tracking-widest text-[8px]">Földrengések</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-slate-200 font-bold">Erős (M>6)</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div><span className="text-slate-200 font-bold">Közepes (M3-6)</span></div>
        </div>
        <div className="border-t border-slate-800 pt-2 space-y-2">
          <div className="text-slate-500 font-black uppercase tracking-widest text-[8px]">Vulkánok</div>
          <div className="flex items-center gap-2"><div className="w-0 h-0 border-x-[6px] border-x-transparent border-b-[10px] border-b-red-500"></div><span className="text-slate-200 font-bold">Aktív</span></div>
        </div>
      </div>
    </div>
  );
};

export default EarthquakeMap;