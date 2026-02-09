
import React, { useEffect, useRef } from 'react';
/* Import specific D3 functions to fix property access errors */
import { 
  select, 
  scaleLinear, 
  axisBottom, 
  axisLeft, 
  area, 
  line 
} from 'd3';
import { X, ArrowDown, ArrowRight, ArrowLeft, Zap } from 'lucide-react';
import { Earthquake, Plate, Volcano } from '../types';

interface CrossSectionViewProps {
  item: Earthquake | Plate | Volcano | null;
  onClose: () => void;
}

const CrossSectionView: React.FC<CrossSectionViewProps> = ({ item, onClose }) => {
  const canvasRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !item) return;

    /* Use imported select function */
    const svg = select(canvasRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 60, left: 80 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    /* Use imported scaleLinear function */
    const xScale = scaleLinear().domain([0, 1000]).range([0, innerWidth]);
    const yScale = scaleLinear().domain([0, 700]).range([0, innerHeight]); // Depth scale

    /* Use imported axisBottom and axisLeft functions */
    const xAxis = axisBottom(xScale).ticks(5).tickFormat(d => `${d} km`);
    const yAxis = axisLeft(yScale).ticks(7).tickFormat(d => `${d} km`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 40)
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Távolság (km)');

    g.append('g')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -60)
      .attr('x', -innerHeight / 2)
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .text('Mélység (km)');

    // Background - Mantle
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'url(#mantle-gradient)');

    // Gradients
    const defs = svg.append('defs');
    const mantleGrad = defs.append('linearGradient')
      .attr('id', 'mantle-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    mantleGrad.append('stop').attr('offset', '0%').attr('stop-color', '#451a03');
    mantleGrad.append('stop').attr('offset', '100%').attr('stop-color', '#1c1917');

    // Plate logic based on type
    // For this demo, we visualize a "Subduction Zone" as the most educational one
    // In a real app, we'd check if (item as Plate).rawName or coordinate proximity to known boundaries
    
    /* Use imported area function */
    const oceanicPlate = area()
      .x((d: any) => xScale(d.x))
      .y0(0)
      .y1((d: any) => yScale(d.y));

    const oceanicData = [
      { x: 0, y: 40 },
      { x: 400, y: 40 },
      { x: 800, y: 500 }
    ];

    g.append('path')
      .datum(oceanicData)
      .attr('d', oceanicPlate as any)
      .attr('fill', '#334155')
      .attr('stroke', '#475569')
      .attr('stroke-width', 2);

    // Draw Continental Plate (Overriding)
    const continentalData = [
      { x: 450, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 100 },
      { x: 550, y: 80 }
    ];

    /* Use imported line function */
    g.append('path')
      .datum(continentalData)
      .attr('d', line().x((d: any) => xScale(d.x)).y((d: any) => yScale(d.y)) as any + 'Z')
      .attr('fill', '#78350f')
      .attr('stroke', '#92400e')
      .attr('stroke-width', 2);

    // Labels
    g.append('text')
      .attr('x', xScale(100))
      .attr('y', yScale(30))
      .attr('fill', '#cbd5e1')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text('ÓCEÁNI LEMEZ');

    g.append('text')
      .attr('x', xScale(750))
      .attr('y', yScale(30))
      .attr('fill', '#fbbf24')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text('KONTINENTÁLIS LEMEZ');

    // Animation Arrows (Subduction)
    const arrowsG = g.append('g').attr('class', 'arrows');
    
    const drawArrow = (x: number, y: number, angle: number) => {
      arrowsG.append('path')
        .attr('d', 'M0,0 L10,5 L0,10 L2,5 Z')
        .attr('fill', '#ef4444')
        .attr('transform', `translate(${xScale(x)},${yScale(y)}) rotate(${angle})`)
        .append('animateTransform')
        .attr('attributeName', 'transform')
        .attr('type', 'translate')
        .attr('from', `${xScale(x)},${yScale(y)}`)
        .attr('to', `${xScale(x + 20 * Math.cos(angle * Math.PI / 180))},${yScale(y + 20 * Math.sin(angle * Math.PI / 180))}`)
        .attr('dur', '1.5s')
        .attr('repeatCount', 'indefinite');
    };

    drawArrow(200, 60, 0);
    drawArrow(550, 250, 45);

    // If it's an earthquake, draw the focus (hypocenter)
    if (item && 'mag' in item && (item as Earthquake).mag !== undefined) {
      const eq = item as Earthquake;
      const depth = eq.coordinates[2];
      
      // Determine a reasonable X position for visualization (usually near the subduction interface)
      // For demo, we place it on the subducting slab based on depth
      const eqX = 400 + (depth * 0.8);

      const eqGroup = g.append('g')
        .attr('transform', `translate(${xScale(eqX)},${yScale(depth)})`);

      eqGroup.append('circle')
        .attr('r', 8)
        .attr('fill', '#ef4444')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', '6;12;6')
        .attr('dur', '1s')
        .attr('repeatCount', 'indefinite');

      eqGroup.append('text')
        .attr('x', 15)
        .attr('y', 5)
        .attr('fill', '#fff')
        .attr('font-size', '12px')
        .attr('font-weight', 'black')
        .text(`FÓKUSZ (M ${eq.mag})`);
      
      // Depth line
      g.append('line')
        .attr('x1', 0)
        .attr('y1', yScale(depth))
        .attr('x2', xScale(eqX))
        .attr('y2', yScale(depth))
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');
    }

    // Legend
    const legend = g.append('g').attr('transform', `translate(${innerWidth - 120}, 20)`);
    
    legend.append('rect').attr('width', 10).attr('height', 10).attr('fill', '#334155');
    legend.append('text').attr('x', 15).attr('y', 10).attr('fill', '#94a3b8').attr('font-size', '9px').text('Litoszféra');

    legend.append('rect').attr('width', 10).attr('height', 10).attr('y', 15).attr('fill', '#451a03');
    legend.append('text').attr('x', 15).attr('y', 25).attr('fill', '#94a3b8').attr('font-size', '9px').text('Asztenoszféra');

  }, [item]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative">
        <header className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-xl">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100 uppercase tracking-tight">Mélyszelvény Vizualizáció</h3>
              <p className="text-xs text-slate-400 font-medium">Lemeztektonikai keresztmetszet • {item && ('place' in item ? item.place : 'name' in item ? item.name : 'Kijelölt terület')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="p-8 flex justify-center bg-slate-950/30">
          <svg 
            ref={canvasRef} 
            width="600" 
            height="400" 
            viewBox="0 0 600 400"
            className="max-w-full h-auto drop-shadow-2xl"
          ></svg>
        </div>

        <footer className="p-6 bg-slate-900 border-t border-slate-800">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-500 uppercase">Típus</span>
              <span className="text-sm font-bold text-blue-400">Szubdukció</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-500 uppercase">Jellemző</span>
              <span className="text-sm font-bold text-slate-200">Konvergens határ</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-500 uppercase">Földtani környezet</span>
              <span className="text-sm font-bold text-slate-200">Andezitvulkanizmus</span>
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-500 leading-relaxed font-medium italic border-l-2 border-blue-500 pl-4">
            A fenti ábrán látható, ahogy a sűrűbb óceáni lemez a kevésbé sűrű kontinentális lemez alá bukik. A súrlódás és a kőzetolvadás földrengéseket és vulkáni íveket hoz létre.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default CrossSectionView;
