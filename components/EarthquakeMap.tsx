
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Earthquake, Volcano, Plate } from '../types';

interface EarthquakeMapProps {
  earthquakes: Earthquake[];
  volcanoes: Volcano[];
  showEarthquakes: boolean;
  showPlates: boolean;
  showVolcanoes: boolean;
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
  showVolcanoes,
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

    // Load world map
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
        .attr('stroke', '#334155');
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        g.selectAll('.plate-label').style('font-size', `${10 / event.transform.k}px`);
      });

    svg.call(zoom);
  }, [path]);

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
          .attr('class', 'plate-boundary cursor-pointer transition-all')
          .merge(plates as any)
          .attr('d', path as any)
          .attr('fill', (d: any) => {
            const rawName = d.properties.PlateName || d.properties.LAYER || "";
            return rawName === selectedPlateName ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.05)';
          })
          .attr('stroke', '#ef4444')
          .attr('stroke-width', (d: any) => {
            const rawName = d.properties.PlateName || d.properties.LAYER || "";
            return rawName === selectedPlateName ? 1.5 : 0.5;
          })
          .attr('stroke-dasharray', '2,2')
          .style('opacity', 0.6)
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
          .style('font-weight', '600')
          .style('text-transform', 'uppercase')
          .style('pointer-events', 'none')
          .style('opacity', 0.8)
          .style('text-shadow', '0 0 3px #000');
          
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
      const dots = g.selectAll('.eq-dot')
        .data(filteredEqs, (d: any) => d.id);

      dots.exit().remove();

      dots.enter()
        .append('circle')
        .attr('class', 'eq-dot cursor-pointer transition-all hover:stroke-white')
        .merge(dots as any)
        .attr('cx', (d: any) => projection(d.coordinates as [number, number])?.[0] || 0)
        .attr('cy', (d: any) => projection(d.coordinates as [number, number])?.[1] || 0)
        .attr('r', (d: any) => Math.max(2, (d.mag - 2) * 2))
        .attr('fill', (d: any) => d.id === selectedEqId ? '#fbbf24' : d.mag > 6 ? '#f87171' : '#fcd34d')
        .attr('fill-opacity', 0.6)
        .attr('stroke', (d: any) => d.id === selectedEqId ? '#fff' : 'none')
        .attr('stroke-width', 1)
        .on('click', (event, d: any) => {
          event.stopPropagation();
          onSelectEq(d);
          onSelectPlate(null);
          onSelectVolcano(null);
        });
    } else {
      g.selectAll('.eq-dot').remove();
    }

  }, [earthquakes, currentTimestamp, projection, selectedEqId, onSelectEq, onSelectPlate, onSelectVolcano, showEarthquakes]);

  // Update Volcanoes
  useEffect(() => {
    const g = d3.select(gRef.current);
    if (showVolcanoes) {
      const volcs = g.selectAll('.volcano')
        .data(volcanoes, (d: any) => d.name);
      
      volcs.enter()
        .append('path')
        .attr('class', 'volcano cursor-pointer transition-all hover:opacity-100')
        .merge(volcs as any)
        .attr('d', d3.symbol().type(d3.symbolTriangle).size(40) as any)
        .attr('transform', (d: any) => `translate(${projection(d.coordinates)?.[0]}, ${projection(d.coordinates)?.[1]})`)
        .attr('fill', (d: any) => d.name === selectedVolcanoName ? '#fb923c' : '#f97316')
        .attr('stroke', (d: any) => d.name === selectedVolcanoName ? '#fff' : 'none')
        .attr('stroke-width', 1.5)
        .style('opacity', (d: any) => d.name === selectedVolcanoName ? 1 : 0.8)
        .on('click', (event, d: any) => {
          event.stopPropagation();
          onSelectVolcano(d);
          onSelectEq(null);
          onSelectPlate(null);
        });

      volcs.exit().remove();
    } else {
      g.selectAll('.volcano').remove();
    }
  }, [showVolcanoes, volcanoes, projection, selectedVolcanoName, onSelectVolcano, onSelectEq, onSelectPlate]);

  return (
    <div 
      className="w-full h-full bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden"
      onClick={() => {
        onSelectEq(null);
        onSelectPlate(null);
        onSelectVolcano(null);
      }}
    >
      <svg ref={svgRef} className="w-full h-full">
        <g ref={gRef}></g>
      </svg>
      <div className="absolute top-4 right-4 bg-slate-900/80 p-2 rounded border border-slate-700 text-xs backdrop-blur pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-red-400 opacity-60"></div>
          <span>Jelentős (M > 6.0)</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-60"></div>
          <span>Közepes (M 3.0-6.0)</span>
        </div>
        {showVolcanoes && (
          <div className="flex items-center gap-2">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-orange-500"></div>
            <span>Aktív vulkán</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EarthquakeMap;
