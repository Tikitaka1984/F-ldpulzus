
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
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
  "Cocos Plate": "Cocos-lemez",
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
    d3.geoNaturalEarth1()
      .scale(160)
      .translate([450, 250])
  , []);

  const path = d3.geoPath().projection(projection);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    // Clean previous
    svg.selectAll('defs').remove();

    // Filter definitions for glow and shadows
    const defs = svg.append('defs');
    
    // Glow for active volcanoes
    const glowFilter = defs.append('filter')
      .attr('id', 'active-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'blur');
    
    glowFilter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Selection ring pulse animation
    const ringPulse = defs.append('radialGradient')
      .attr('id', 'ring-pulse')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    ringPulse.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.6);
    ringPulse.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0);

    // Load world map if not already there
    if (g.selectAll('.country').empty()) {
      d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((data: any) => {
        // @ts-ignore
        const countries = topojson.feature(data, data.objects.countries);
        
        g.selectAll('.country')
          .data((countries as any).features)
          .enter()
          .append('path')
          .attr('class', 'country')
          .attr('d', path as any)
          .attr('fill', '#1e293b')
          .attr('stroke', '#334155')
          .attr('stroke-width', 0.5);
      });
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        g.selectAll('.plate-label').style('font-size', `${10 / event.transform.k}px`);
        g.selectAll('.eq-dot').attr('stroke-width', 1 / event.transform.k);
        g.selectAll('.volcano').attr('stroke-width', 1.5 / event.transform.k);
      });

    svg.call(zoom);

    // Resize listener to help projection center if needed
    const handleResize = () => {
      if (containerRef.current && svgRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        projection.translate([width / 2, height / 2]);
        g.selectAll('path').attr('d', path as any);
        // Refresh positions
        refreshMarkers();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [path]);

  const refreshMarkers = () => {
    const g = d3.select(gRef.current);
    g.selectAll('.eq-dot')
      .attr('cx', (d: any) => projection(d.coordinates as [number, number])?.[0] || 0)
      .attr('cy', (d: any) => projection(d.coordinates as [number, number])?.[1] || 0);
    g.selectAll('.volcano')
      .attr('transform', (d: any) => `translate(${projection(d.coordinates)?.[0]}, ${projection(d.coordinates)?.[1]})`);
    g.selectAll('.plate-label')
      .attr('transform', (d: any) => {
        const centroid = path.centroid(d);
        if (isNaN(centroid[0]) || isNaN(centroid[1])) return 'translate(0,0)';
        return `translate(${centroid[0]}, ${centroid[1]})`;
      });
  };

  // Tooltip helpers
  const showTooltip = (content: string, event: any) => {
    if (!tooltipRef.current) return;
    const tooltip = d3.select(tooltipRef.current);
    tooltip.style('opacity', 1)
           .html(content)
           .style('left', (event.pageX + 10) + 'px')
           .style('top', (event.pageY - 20) + 'px');
  };

  const hideTooltip = () => {
    if (!tooltipRef.current) return;
    d3.select(tooltipRef.current).style('opacity', 0);
  };

  // Update Tectonic Plates and Names
  useEffect(() => {
    const g = d3.select(gRef.current);
    if (showPlates) {
       d3.json('https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json').then((data: any) => {
        const features = (data as any).features;

        const plates = g.selectAll('.plate-boundary')
          .data(features, (d: any) => d.properties.PlateName || d.properties.LAYER);

        plates.enter()
          .append('path')
          .attr('class', 'plate-boundary cursor-pointer transition-colors duration-200')
          .merge(plates as any)
          .attr('d', path as any)
          .attr('fill', (d: any) => {
            const rawName = d.properties.PlateName || d.properties.LAYER || "";
            return rawName === selectedPlateName ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.04)';
          })
          .attr('stroke', (d: any) => {
            const rawName = d.properties.PlateName || d.properties.LAYER || "";
            return rawName === selectedPlateName ? '#ef4444' : '#f87171';
          })
          .attr('stroke-width', (d: any) => {
            const rawName = d.properties.PlateName || d.properties.LAYER || "";
            return rawName === selectedPlateName ? 1.8 : 0.6;
          })
          .attr('stroke-dasharray', (d: any) => {
             const rawName = d.properties.PlateName || d.properties.LAYER || "";
             return rawName === selectedPlateName ? 'none' : '3,3';
          })
          .style('opacity', 0.8)
          .on('mouseover', function(event, d: any) {
            const rawName = d.properties.PlateName || d.properties.LAYER || "";
            const huName = PLATE_NAMES_HU[rawName] || rawName;
            d3.select(this).attr('fill', 'rgba(239, 68, 68, 0.3)');
            showTooltip(`<div class="font-bold text-red-400">${huName}</div><div class="text-[10px] text-slate-400 uppercase">Kőzetlemez</div>`, event);
          })
          .on('mousemove', (event) => {
            showTooltip(d3.select(tooltipRef.current).html(), event);
          })
          .on('mouseout', function(event, d: any) {
            const rawName = d.properties.PlateName || d.properties.LAYER || "";
            d3.select(this).attr('fill', rawName === selectedPlateName ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.04)');
            hideTooltip();
          })
          .on('click', (event, d: any) => {
            event.stopPropagation();
            const rawName = d.properties.PlateName || d.properties.LAYER || "";
            onSelectPlate({
              name: PLATE_NAMES_HU[rawName] || rawName,
              rawName: rawName,
              feature: d
            });
            onSelectEq(null);
            onSelectVolcano(null);
          });

        const labels = g.selectAll('.plate-label')
          .data(features, (d: any) => d.properties.PlateName || d.properties.LAYER);

        labels.enter()
          .append('text')
          .attr('class', 'plate-label')
          .merge(labels as any)
          .attr('transform', (d: any) => {
             const centroid = path.centroid(d);
             if (isNaN(centroid[0]) || isNaN(centroid[1])) return 'translate(0,0)';
             return `translate(${centroid[0]}, ${centroid[1]})`;
          })
          .text((d: any) => {
             const rawName = d.properties.PlateName || d.properties.LAYER || "";
             return PLATE_NAMES_HU[rawName] || rawName;
          })
          .attr('text-anchor', 'middle')
          .attr('fill', (d: any) => {
             const rawName = d.properties.PlateName || d.properties.LAYER || "";
             return rawName === selectedPlateName ? '#fff' : '#f87171';
          })
          .style('font-size', '10px')
          .style('font-weight', '700')
          .style('text-transform', 'uppercase')
          .style('pointer-events', 'none')
          .style('opacity', 0.8)
          .style('text-shadow', '0 0 4px #000');
          
        plates.exit().remove();
        labels.exit().remove();
      });
    } else {
      g.selectAll('.plate-boundary').remove();
      g.selectAll('.plate-label').remove();
    }
  }, [showPlates, path, selectedPlateName, onSelectPlate, onSelectEq, onSelectVolcano]);

  // Update Earthquakes
  useEffect(() => {
    const g = d3.select(gRef.current);
    
    if (showEarthquakes) {
      const filteredEqs = earthquakes.filter(eq => eq.time <= currentTimestamp);
      const dots = g.selectAll('.eq-group')
        .data(filteredEqs, (d: any) => d.id);

      dots.exit().remove();

      const dotsEnter = dots.enter().append('g').attr('class', 'eq-group');

      // Selection pulse ring
      dotsEnter.append('circle')
        .attr('class', 'selection-pulse')
        .attr('r', 0)
        .attr('fill', 'url(#ring-pulse)')
        .style('pointer-events', 'none')
        .style('opacity', 0);

      dotsEnter.append('circle')
        .attr('class', 'eq-dot cursor-pointer transition-all duration-300')
        .on('mouseover', function(event, d: any) {
          d3.select(this)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('r', (d: any) => Math.max(3, (d.mag - 2) * 2.5));
          showTooltip(`
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="px-1.5 py-0.5 rounded bg-yellow-500 text-slate-900 text-[10px] font-black">M ${d.mag.toFixed(1)}</span>
                <span class="font-bold text-slate-100">${d.place}</span>
              </div>
              <div class="text-[9px] text-slate-400 uppercase tracking-widest font-bold">${new Date(d.time).toLocaleDateString('hu-HU')}</div>
            </div>
          `, event);
        })
        .on('mousemove', (event) => {
          showTooltip(d3.select(tooltipRef.current).html(), event);
        })
        .on('mouseout', function(event, d: any) {
          d3.select(this)
            .attr('stroke', d.id === selectedEqId ? '#fff' : 'none')
            .attr('stroke-width', 1)
            .attr('r', (d: any) => Math.max(2, (d.mag - 2) * 2));
          hideTooltip();
        })
        .on('click', (event, d: any) => {
          event.stopPropagation();
          onSelectEq(d);
          onSelectPlate(null);
          onSelectVolcano(null);
        });

      const dotsMerge = dotsEnter.merge(dots as any);

      dotsMerge.select('.eq-dot')
        .attr('cx', (d: any) => projection(d.coordinates as [number, number])?.[0] || 0)
        .attr('cy', (d: any) => projection(d.coordinates as [number, number])?.[1] || 0)
        .attr('r', (d: any) => Math.max(2, (d.mag - 2) * 2))
        .attr('fill', (d: any) => d.id === selectedEqId ? '#3b82f6' : d.mag > 6 ? '#ef4444' : '#f59e0b')
        .attr('fill-opacity', 0.7)
        .attr('stroke', (d: any) => d.id === selectedEqId ? '#fff' : 'none');

      // Animate selection pulse
      dotsMerge.select('.selection-pulse')
        .attr('cx', (d: any) => projection(d.coordinates as [number, number])?.[0] || 0)
        .attr('cy', (d: any) => projection(d.coordinates as [number, number])?.[1] || 0)
        .transition()
        .duration(1000)
        .attr('r', (d: any) => d.id === selectedEqId ? 25 : 0)
        .style('opacity', (d: any) => d.id === selectedEqId ? 1 : 0)
        .on('end', function repeat() {
           d3.select(this)
             .attr('r', 10)
             .style('opacity', 1)
             .transition()
             .duration(1500)
             .attr('r', 30)
             .style('opacity', 0)
             .on('end', repeat);
        });

    } else {
      g.selectAll('.eq-group').remove();
    }

  }, [earthquakes, currentTimestamp, projection, selectedEqId, onSelectEq, onSelectPlate, onSelectVolcano, showEarthquakes]);

  // Update Volcanoes
  useEffect(() => {
    const g = d3.select(gRef.current);
    
    const visibleVolcanoes = volcanoes.filter(v => 
      (v.status === 'active' && showActiveVolcanoes) || 
      (v.status === 'dormant' && showDormantVolcanoes)
    );

    const volcs = g.selectAll('.volcano')
      .data(visibleVolcanoes, (d: any) => d.name);
    
    volcs.enter()
      .append('path')
      .attr('class', 'volcano cursor-pointer transition-all duration-300 hover:scale-125')
      .merge(volcs as any)
      .attr('d', d3.symbol().type(d3.symbolTriangle).size(80) as any)
      .attr('transform', (d: any) => `translate(${projection(d.coordinates)?.[0]}, ${projection(d.coordinates)?.[1]})`)
      .attr('fill', (d: any) => {
         if (d.name === selectedVolcanoName) return '#fff';
         return d.status === 'active' ? '#ef4444' : '#fdba74';
      })
      .attr('stroke', (d: any) => d.name === selectedVolcanoName ? '#3b82f6' : d.status === 'active' ? '#fecaca' : 'none')
      .attr('stroke-width', (d: any) => d.name === selectedVolcanoName ? 3 : 1.5)
      .style('filter', (d: any) => d.status === 'active' ? 'url(#active-glow)' : 'none')
      .style('opacity', (d: any) => d.name === selectedVolcanoName ? 1 : 0.9)
      .on('mouseover', function(event, d: any) {
        d3.select(this).attr('stroke', '#fff').attr('stroke-width', 2.5);
        showTooltip(`
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full ${d.status === 'active' ? 'bg-red-500 animate-pulse' : 'bg-orange-300'}"></span>
              <span class="font-black text-slate-100">${d.name}</span>
            </div>
            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${d.country} • ${d.type}</div>
            <div class="text-[9px] text-orange-400 font-bold">${d.elevation} m tengerszint felett</div>
          </div>
        `, event);
      })
      .on('mousemove', (event) => {
        showTooltip(d3.select(tooltipRef.current).html(), event);
      })
      .on('mouseout', function(event, d: any) {
        d3.select(this)
          .attr('stroke', d.name === selectedVolcanoName ? '#3b82f6' : d.status === 'active' ? '#fecaca' : 'none')
          .attr('stroke-width', d.name === selectedVolcanoName ? 3 : 1.5);
        hideTooltip();
      })
      .on('click', (event, d: any) => {
        event.stopPropagation();
        onSelectVolcano(d);
        onSelectEq(null);
        onSelectPlate(null);
      });

    volcs.exit().remove();
    
  }, [showActiveVolcanoes, showDormantVolcanoes, volcanoes, projection, selectedVolcanoName, onSelectVolcano, onSelectEq, onSelectPlate]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden shadow-2xl transition-all duration-300"
      onClick={() => {
        onSelectEq(null);
        onSelectPlate(null);
        onSelectVolcano(null);
      }}
    >
      <svg ref={svgRef} className="w-full h-full">
        <g ref={gRef}></g>
      </svg>

      {/* Interactive Tooltip */}
      <div 
        ref={tooltipRef}
        className="fixed pointer-events-none bg-slate-900/95 border border-slate-700/50 p-3 rounded-xl shadow-2xl backdrop-blur-md opacity-0 transition-opacity duration-200 z-50 min-w-[150px]"
        style={{ transform: 'translate(-50%, -100%)' }}
      ></div>

      {/* Legend Overlay */}
      <div className="absolute top-4 right-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-700 text-[10px] backdrop-blur-lg pointer-events-none space-y-3 shadow-xl">
        <div className="flex flex-col gap-2">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Események</div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
            <span className="text-slate-200 font-bold uppercase tracking-tight">Erős rengés (M > 6)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
            <span className="text-slate-200 font-bold uppercase tracking-tight">Közepes rengés (M 3-6)</span>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-2">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Vulkanizmus</div>
          <div className="flex items-center gap-3">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-red-500 filter drop-shadow-[0_0_4px_rgba(239,68,68,0.8)]"></div>
            <span className="text-red-400 font-black uppercase tracking-tight">Aktív vulkán</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-orange-300"></div>
            <span className="text-slate-300 font-bold uppercase tracking-tight">Alvó vulkán</span>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-2">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Szerkezet</div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-0.5 bg-red-400/50 border-t border-dashed border-red-500"></div>
            <span className="text-slate-400 font-bold uppercase tracking-tight">Lemezhatár</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarthquakeMap;
