import jsPDF from 'jspdf';
import { TestRecord } from '@/types';

async function getImageSize(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
    setTimeout(() => resolve(null), 2500);
  });
}

export async function downloadPDF(records: TestRecord[], projectName: string = 'Proyecto'): Promise<void> {
  if (records.length === 0) {
    alert('No hay registros para exportar');
    return;
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;
  
  let isFirstPage = true;

  for (const record of records) {
    // Crear página nueva si no es la primera
    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;

    let yPosition = margin;
    const lineHeight = 5;
    const fontSize = 10;
    const titleFontSize = 14;
    const labelFontSize = 9;

    // Función para añadir texto con ajuste automático
    const addWrappedText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      fontSize: number = 10,
      isBold: boolean = false
    ) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + lines.length * (fontSize * 0.3);
    };

    // Título
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(45, 85, 200); // Azul
    yPosition = addWrappedText(`Bug Report: ${record.titulo}`, margin, yPosition + 3, contentWidth, 14, true);
    yPosition += 2;

    // Línea separadora
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    // ID y Fecha
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const fecha = record.fechaCreacion ? new Date(record.fechaCreacion).toLocaleDateString('es-ES') : '-';
    pdf.text(`ID: ${record.id} | Fecha: ${fecha}`, margin, yPosition);
    yPosition += lineHeight + 2;

    // Estado con color
    const estadoColors: Record<string, [number, number, number]> = {
      'Corregido': [198, 239, 206],
      'En Progreso': [255, 235, 156],
      'Pendiente': [255, 199, 206],
      'No es un Error': [230, 230, 230],
    };
    const estadoColor = estadoColors[record.estado || ''] || [230, 230, 230];
    pdf.setFillColor(estadoColor[0], estadoColor[1], estadoColor[2]);
    pdf.rect(margin, yPosition - 3, contentWidth, lineHeight + 1, 'F');
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Estado: ${record.estado}`, margin + 2, yPosition + 1);
    yPosition += lineHeight + 4;

    // Información principal en grid 2 columnas
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(labelFontSize);
    pdf.setTextColor(60, 60, 60);

    const infoItems = [
      { label: 'Actor', value: record.actor || '-' },
      { label: 'Módulo', value: record.modulo || '-' },
      { label: 'Tipo de Error', value: record.tipoError || '-' },
      { label: 'Dispositivo', value: record.device || '-' },
    ];

    for (let i = 0; i < infoItems.length; i += 2) {
      const item1 = infoItems[i];
      const item2 = infoItems[i + 1];

      pdf.setFont('helvetica', 'bold');
      pdf.text(`${item1.label}:`, margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(item1.value, margin + 25, yPosition, contentWidth - 25, fontSize);

      if (item2) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${item2.label}:`, margin + contentWidth / 2, yPosition - (fontSize * 0.3 * 1));
        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(item2.value, margin + contentWidth / 2 + 25, yPosition - (fontSize * 0.3 * 1), contentWidth / 2 - 25, fontSize);
      }

      yPosition += 2;
    }

    yPosition += 2;

    // Imagenes (todas) si existen
    const imageUrls = (record.evidencia || [])
      .filter((e): e is string => typeof e === 'string')
      .filter((e) => e.startsWith('data:image'));

    if (imageUrls.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(labelFontSize);
      pdf.text('Evidencia:', margin, yPosition);
      yPosition += 4;

      // Grid dinamico para mostrar todas las imagenes en una sola pagina por registro.
      const columns = imageUrls.length === 1 ? 1 : 2;
      const gap = 3;
      const gridWidth = contentWidth;
      const cellWidth = (gridWidth - gap * (columns - 1)) / columns;
      const rows = Math.ceil(imageUrls.length / columns);

      // Reservamos espacio para texto inferior y footer.
      const remainingHeight = Math.max(36, pageHeight - yPosition - margin - 38);
      const maxCellHeightByRows = (remainingHeight - gap * (rows - 1)) / rows;

      let tallestInRow = 0;
      for (let i = 0; i < imageUrls.length; i++) {
        const col = i % columns;
        if (col === 0) {
          tallestInRow = 0;
        }

        const imgUrl = imageUrls[i];
        const size = await getImageSize(imgUrl);
        if (!size) {
          continue;
        }

        const ratio = size.height / size.width;
        let finalWidth = cellWidth;
        let finalHeight = finalWidth * ratio;

        if (finalHeight > maxCellHeightByRows) {
          finalHeight = maxCellHeightByRows;
          finalWidth = finalHeight / ratio;
        }

        const x = margin + col * (cellWidth + gap) + (cellWidth - finalWidth) / 2;
        const y = yPosition;

        const format = imgUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        pdf.addImage(imgUrl, format, x, y, finalWidth, finalHeight);

        if (finalHeight > tallestInRow) {
          tallestInRow = finalHeight;
        }

        const isLastInRow = col === columns - 1 || i === imageUrls.length - 1;
        if (isLastInRow) {
          yPosition += tallestInRow + gap;
        }
      }
    }

    // Descripción/Notas
    if (record.pasosReproducir || record.resultadoEsperado || record.resultadoActual) {
      yPosition += 2;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(labelFontSize);
      pdf.text('Detalles técnicos:', margin, yPosition);
      yPosition += lineHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(fontSize - 1);

      if (record.pasosReproducir) {
        yPosition = addWrappedText(
          `Pasos: ${record.pasosReproducir}`,
          margin + 2,
          yPosition,
          contentWidth - 2,
          fontSize - 1
        );
        yPosition += 1;
      }

      if (record.resultadoEsperado) {
        yPosition = addWrappedText(
          `Esperado: ${record.resultadoEsperado}`,
          margin + 2,
          yPosition,
          contentWidth - 2,
          fontSize - 1
        );
        yPosition += 1;
      }

      if (record.resultadoActual) {
        yPosition = addWrappedText(
          `Actual: ${record.resultadoActual}`,
          margin + 2,
          yPosition,
          contentWidth - 2,
          fontSize - 1
        );
        yPosition += 1;
      }
    }

    // Notas del desarrollador
    if (record.notasDev) {
      yPosition += 2;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(labelFontSize);
      pdf.setTextColor(150, 0, 0);
      pdf.text('Notas Dev:', margin, yPosition);
      yPosition += lineHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(fontSize - 1);
      pdf.setTextColor(100, 0, 0);
      yPosition = addWrappedText(record.notasDev, margin + 2, yPosition, contentWidth - 2, fontSize - 1);
    }

    // Pie de página
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`${projectName} • ${new Date().toLocaleDateString('es-ES')}`, margin, pageHeight - 5);
  }

  // Descargar PDF
  const filename = `bugs-report-${projectName}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}
