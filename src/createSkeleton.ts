/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

export default function createSkeleton(doc: Document) {
  // eslint-disable-next-line @typescript-eslint/tslint/config
  const ns = 'http://www.w3.org/2000/svg';
  const svg = doc.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 300 200');
  svg.style.width = '100%';
  svg.style.height = '100%';

  const rect = (x: number, y: number, w: number, h: number, bg: string = '#A6A8AB') => {
    const rect = doc.createElementNS(ns, 'rect');
    rect.setAttribute('x', x.toString());
    rect.setAttribute('y', y.toString());
    rect.setAttribute('width', w.toString());
    rect.setAttribute('height', h.toString());
    rect.setAttribute('fill', bg);
    return rect;
  };
  const circle = (x: number, y: number, d: number, filled: boolean) => {
    const circle = doc.createElementNS(ns, 'circle');
    circle.setAttribute('cx', (x + d / 2).toString());
    circle.setAttribute('cy', (y + d / 2).toString());
    circle.setAttribute('r', (d / 2).toString());
    circle.setAttribute('fill', filled ? '#A6A8AB' : '#E1E2E3');
    return circle;
  };
  svg.appendChild(rect(0, 0, 300, 200, '#F4F4F4'));
  const wi = 20;
  const padding = 10;

  const sWidth = 75;
  const sY = 110;

  const cHeight = 100;
  const csX = 85;

  const cOffsets = [10, 20, 35, 60, 65, 80, 90];
  const sOffsets = [50, 30, 15];
  cOffsets.forEach((offset, i) => {
    svg.appendChild(rect(csX + i * (wi + padding), offset, wi, cHeight - offset));
  });

  sOffsets.forEach((offset, j) => {
    svg.appendChild(rect(offset, sY + j * (wi + padding), sWidth - offset, wi));
  });

  cOffsets.forEach((_, i) => {
    sOffsets.forEach((_, j) => {
      const filled = j === 2 - i || (i == 3 && j > 0) || (i === 4 && j !== 1) || (i === 5 && j < 2) || i === 6;
      svg.appendChild(circle(csX + i * (wi + padding), sY + j * (wi + padding), wi, filled));
    });
  });
  const lw = 6;
  svg.appendChild(rect(csX + (wi - lw) / 2 + 3 * (wi + padding), sY + 10 + 1 * (wi + padding), lw, 30));
  svg.appendChild(rect(csX + (wi - lw) / 2 + 4 * (wi + padding), sY + 10, lw, 60));
  svg.appendChild(rect(csX + (wi - lw) / 2 + 5 * (wi + padding), sY + 10, lw, 30));
  svg.appendChild(rect(csX + (wi - lw) / 2 + 6 * (wi + padding), sY + 10, lw, 60));

  return svg;
}
