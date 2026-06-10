import { writePsd } from 'ag-psd';
import { saveAs } from 'file-saver';

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image: ' + src));
    img.src = src;
  });
};

export async function exportToPsd(
  imageUrl: string,
  issues: any[],
  referenceImages: string[] = [],
  filename: string = 'audit_result.psd'
) {
  const canvasesToCleanup: HTMLCanvasElement[] = [];
  try {
    const genImg = await loadImage(imageUrl);
    const width = genImg.width;
    const height = genImg.height;

    // 1. Generated Image Canvas
    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = width;
    imgCanvas.height = height;
    canvasesToCleanup.push(imgCanvas);
    const ctxImg = imgCanvas.getContext('2d');
    if (!ctxImg) throw new Error('No canvas context');
    ctxImg.drawImage(genImg, 0, 0);

    // 2. Annotation Canvas
    const boxCanvas = document.createElement('canvas');
    boxCanvas.width = width;
    boxCanvas.height = height;
    canvasesToCleanup.push(boxCanvas);
    const ctxBox = boxCanvas.getContext('2d');
    if (!ctxBox) throw new Error('No canvas context');
    ctxBox.clearRect(0, 0, width, height);

    // Anchor pixels at corners to prevent ag-psd from auto-trimming and shifting the layer
    ctxBox.fillStyle = 'rgba(0,0,0,0.01)';
    ctxBox.fillRect(0, 0, 1, 1);
    ctxBox.fillRect(width - 1, height - 1, 1, 1);

    issues.forEach(issue => {
      const [pctY1, pctX1, pctY2, pctX2] = issue.bbox;
      const maxVal = Math.max(pctX1, pctY1, pctX2, pctY2);
      const scaleFactor = maxVal > 100 ? 10 : 1;
      const x1 = pctX1 / scaleFactor;
      const y1 = pctY1 / scaleFactor;
      const x2 = pctX2 / scaleFactor;
      const y2 = pctY2 / scaleFactor;

      const absX1 = (x1 / 100) * width;
      const absY1 = (y1 / 100) * height;
      const absW = ((x2 - x1) / 100) * width;
      const absH = ((y2 - y1) / 100) * height;

      if (issue.type === 'structure_mismatch') {
        ctxBox.strokeStyle = '#ef4444'; // red
      } else if (issue.type === 'color_mismatch') {
        ctxBox.strokeStyle = '#eab308'; // yellow
      } else if (issue.type === 'pattern_error') {
        ctxBox.strokeStyle = '#f97316'; // orange
      } else {
        ctxBox.strokeStyle = '#ef4444'; // red (text_error)
      }
      
      ctxBox.lineWidth = Math.max(4, width * 0.005);
      ctxBox.setLineDash([Math.max(10, width * 0.01), Math.max(10, width * 0.01)]);
      ctxBox.strokeRect(absX1, absY1, absW, absH);

      ctxBox.fillStyle = ctxBox.strokeStyle.replace(')', ', 0.15)').replace('rgb', 'rgba');
      if (ctxBox.strokeStyle.startsWith('#')) {
           if (issue.type === 'structure_mismatch') ctxBox.fillStyle = 'rgba(239, 68, 68, 0.15)';
           else if (issue.type === 'color_mismatch') ctxBox.fillStyle = 'rgba(234, 179, 8, 0.15)';
           else if (issue.type === 'pattern_error') ctxBox.fillStyle = 'rgba(249, 115, 22, 0.15)';
           else ctxBox.fillStyle = 'rgba(239, 68, 68, 0.15)';
      }
      ctxBox.fillRect(absX1, absY1, absW, absH);
      
      const fontSize = Math.max(16, width * 0.02);
      ctxBox.font = `bold ${fontSize}px sans-serif`;
      ctxBox.fillStyle = '#ffffff';
      ctxBox.setLineDash([]);
      
      const labelStr = issue.type === 'text_error' ? '文字畸变' : issue.type === 'structure_mismatch' ? '结构不一致' : issue.type === 'color_mismatch' ? '颜色偏差' : '图案瑕疵';
      
      let titleFontSize = Math.max(18, width * 0.015);
      let descFontSize = Math.max(14, width * 0.012);
      ctxBox.font = `bold ${titleFontSize}px sans-serif`;
      const titleWidth = ctxBox.measureText(labelStr).width;
      
      let currentDescLines: string[] = [];
      let descBoxWidth = 0;
      
      if (issue.desc) {
          ctxBox.font = `bold ${descFontSize}px sans-serif`;
          const maxLineWidth = Math.max(300, width * 0.25);
          const chars = issue.desc.split('');
          let currentLine = '';
          for (const char of chars) {
              const testLine = currentLine + char;
              if (ctxBox.measureText(testLine).width > maxLineWidth && currentLine.length > 0) {
                  currentDescLines.push(currentLine);
                  currentLine = char;
              } else {
                  currentLine = testLine;
              }
          }
          currentDescLines.push(currentLine);
          descBoxWidth = Math.max(...currentDescLines.map(l => ctxBox.measureText(l).width)) + descFontSize;
      }
      
      const totalBoxWidth = Math.max(titleWidth + titleFontSize, descBoxWidth);
      const totalBoxHeight = (titleFontSize * 1.5) + (currentDescLines.length > 0 ? (currentDescLines.length * (descFontSize * 1.4) + descFontSize) : 0);
      
      // Try to place the text block below the bounding box, slightly to the left.
      let textBlockX = absX1 - 20;
      let textBlockY = absY1 + absH + 40;
      
      // Clamp to screen boundaries
      if (textBlockY + totalBoxHeight > height - 20) {
          textBlockY = absY1 - totalBoxHeight - 40; // place above if no space below
          if (textBlockY < 20) textBlockY = 20; // fallback
      }
      if (textBlockX < 20) textBlockX = 20;
      if (textBlockX + totalBoxWidth > width - 20) textBlockX = width - totalBoxWidth - 20;
      
      // Draw dashed connector line
      ctxBox.beginPath();
      ctxBox.moveTo(absX1 + absW / 2, absY1 + absH / 2); // Center of bbox
      // Connect to the top-center or bottom-center of the text block depending on position
      const isAbove = textBlockY < absY1;
      ctxBox.lineTo(textBlockX + totalBoxWidth / 2, isAbove ? textBlockY + totalBoxHeight : textBlockY);
      // Determine line color from type
      ctxBox.strokeStyle = issue.type === 'structure_mismatch' ? '#ef4444' : 
                           issue.type === 'color_mismatch' ? '#eab308' : 
                           issue.type === 'pattern_error' ? '#f97316' : '#ef4444';
      ctxBox.lineWidth = Math.max(3, width * 0.003);
      ctxBox.setLineDash([10, 10]);
      ctxBox.stroke();
      ctxBox.setLineDash([]);
      
      // Draw Title Box (Black)
      ctxBox.fillStyle = '#000000';
      ctxBox.fillRect(textBlockX, textBlockY, titleWidth + titleFontSize, titleFontSize * 1.5);
      
      ctxBox.fillStyle = '#ffffff';
      ctxBox.font = `bold ${titleFontSize}px sans-serif`;
      ctxBox.fillText(labelStr, textBlockX + titleFontSize * 0.5, textBlockY + titleFontSize * 1.1);
      
      // Draw Desc Box (same color as border)
      if (issue.desc && currentDescLines.length > 0) {
          const descBoxY = textBlockY + titleFontSize * 1.5;
          const descBoxHeight = currentDescLines.length * (descFontSize * 1.4) + descFontSize;
          
          ctxBox.fillStyle = ctxBox.strokeStyle; // Use same color as border/line
                             
          ctxBox.fillRect(textBlockX, descBoxY, totalBoxWidth, descBoxHeight);
          
          ctxBox.fillStyle = '#ffffff';
          ctxBox.font = `bold ${descFontSize}px sans-serif`;
          currentDescLines.forEach((line, idx) => {
              const textY = descBoxY + descFontSize * 1.2 + idx * (descFontSize * 1.4);
              ctxBox.fillText(line, textBlockX + descFontSize * 0.5, textY);
          });
      }
    });

    // 3. Reference Images (Full resolution context, placed in center without scaling)
    const refCanvases = await Promise.all(
      referenceImages.map(async (refUrl, index) => {
        try {
          const refImg = await loadImage(refUrl);
          const c = document.createElement('canvas');
          c.width = refImg.width;
          c.height = refImg.height;
          canvasesToCleanup.push(c);
          const ctx = c.getContext('2d');
          if (ctx) {
            ctx.drawImage(refImg, 0, 0);
            
            // Anchor pixels at corners to prevent ag-psd from auto-trimming and shifting
            ctx.fillStyle = 'rgba(0,0,0,0.01)';
            ctx.fillRect(0, 0, 1, 1);
            ctx.fillRect(refImg.width - 1, refImg.height - 1, 1, 1);
          }
          const leftOffset = Math.round((width - refImg.width) / 2);
          const topOffset = Math.round((height - refImg.height) / 2);
          return { name: `参考图 ${index + 1}`, canvas: c, left: leftOffset, top: topOffset };
        } catch (e) {
          console.warn('Failed to load ref image for PSD:', refUrl);
          return null;
        }
      })
    );

    const validRefs = refCanvases.filter(Boolean) as {name: string, canvas: HTMLCanvasElement, left: number, top: number}[];

    // 4. Composite Previews for PSD Document Thumbnail/Flattened representation
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = width;
    compositeCanvas.height = height;
    canvasesToCleanup.push(compositeCanvas);
    const ctxComp = compositeCanvas.getContext('2d');
    if (ctxComp) {
      ctxComp.fillStyle = '#ffffff';
      ctxComp.fillRect(0, 0, width, height);
      ctxComp.drawImage(imgCanvas, 0, 0);
      ctxComp.drawImage(boxCanvas, 0, 0);
    }

    const children = [
      ...validRefs,
      {
        name: '生成图片',
        canvas: imgCanvas,
        left: 0,
        top: 0
      },
      {
        name: '标注图层',
        canvas: boxCanvas,
        left: 0,
        top: 0
      }
    ];

    const psdData: any = {
      width: width,
      height: height,
      canvas: compositeCanvas,
      children: children
    };

    const buffer = writePsd(psdData);
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, filename);
  } catch (err) {
    console.error('Export PSD Failed:', err);
    throw err;
  } finally {
    canvasesToCleanup.forEach(canvas => {
      canvas.width = 0;
      canvas.height = 0;
    });
  }
}

