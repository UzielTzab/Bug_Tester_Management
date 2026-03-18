import ExcelJS from 'exceljs';
import { TestRecord } from '@/types';

function isDataUrl(s?: string | null) {
  return typeof s === 'string' && s.startsWith('data:');
}

function getImageInfoFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|gif));base64,(.*)$/);
  if (!match) return null;
  const mime = match[1];
  const rawExt = match[2];
  // normalize extension to exceljs accepted values: 'jpeg' | 'png' | 'gif'
  let ext: 'jpeg' | 'png' | 'gif';
  if (rawExt === 'jpg' || rawExt === 'jpeg') ext = 'jpeg';
  else if (rawExt === 'png') ext = 'png';
  else ext = 'gif';
  const base64 = match[3];
  return { mime, ext, base64 };
}

async function loadImageFromDataUrl(dataUrl: string): Promise<{ base64: string; ext: 'jpeg' | 'png' | 'gif'; width: number; height: number } | null> {
  const info = getImageInfoFromDataUrl(dataUrl);
  if (!info) return null;
  return await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ base64: info.base64, ext: info.ext, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export async function exportToExcel(records: TestRecord[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Registro de Bugs');

  ws.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Actor', key: 'actor', width: 12 },
    { header: 'Módulo / Página', key: 'modulo', width: 20 },
    { header: 'Tipo de Error', key: 'tipoError', width: 16 },
    { header: 'Título del Error', key: 'titulo', width: 30 },
    { header: 'Pasos para Reproducir', key: 'pasos', width: 40 },
    { header: 'Resultado Esperado', key: 'resEsperado', width: 30 },
    { header: 'Resultado Actual', key: 'resActual', width: 30 },
    { header: 'Evidencia (Link/Imagen)', key: 'evidencia', width: 50 },
    { header: 'Estado', key: 'estado', width: 16 },
    { header: 'Notas Dev', key: 'notas', width: 30 },
    { header: 'Fecha Creación', key: 'fecha', width: 18 },
  ];

  // Add rows and keep track of rows that have images
  for (const rec of records) {
    ws.addRow({
      id: rec.id,
      actor: rec.actor || '',
      modulo: rec.modulo || '',
      tipoError: rec.tipoError || '',
      titulo: rec.titulo || '',
      pasos: rec.pasosReproducir || '',
      resEsperado: rec.resultadoEsperado || '',
      resActual: rec.resultadoActual || '',
      evidencia: rec.evidencia && !isDataUrl(rec.evidencia) ? rec.evidencia : (rec.evidencia ? 'Imagen embebida' : ''),
      estado: rec.estado || '',
      notas: rec.notasDev || '',
      fecha: rec.fechaCreacion ? new Date(rec.fechaCreacion).toLocaleDateString('es-ES') : '',
    });
  }

  // After adding rows, embed images for data URLs while preserving aspect ratio and fitting into the evidencia column
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const rowNumber = i + 2; // header is row 1
    if (rec.evidencia && isDataUrl(rec.evidencia)) {
      try {
        const loaded = await loadImageFromDataUrl(rec.evidencia);
        if (!loaded) continue;

        // Estimate column width in pixels. ExcelJS column.width is in 'characters' approx; use 7px per character as heuristic
        const col = ws.columns[8];
        const colCharWidth = (col && (col.width as number)) || 50;
        const maxWidthPx = colCharWidth * 7;

        // Calculate scaled dimensions to fit within column width while preserving aspect ratio
        const scale = Math.min(1, maxWidthPx / loaded.width);
        const displayWidth = Math.round(loaded.width * scale);
        const displayHeight = Math.round(loaded.height * scale);

        // Add image and set row height to accommodate it (convert px -> points by *0.75)
        const imageId = workbook.addImage({ base64: loaded.base64, extension: loaded.ext });
        ws.addImage(imageId, {
          tl: { col: 8, row: rowNumber - 1 },
          ext: { width: displayWidth, height: displayHeight },
        });

        // Set row height (points). 1px ~ 0.75pt
        try {
          const row = ws.getRow(rowNumber);
          row.height = displayHeight * 0.75;
        } catch (err) {
          // ignore
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to embed image for record', rec.id, err);
      }
    } else if (rec.evidencia && typeof rec.evidencia === 'string' && rec.evidencia.startsWith('http')) {
      // For URL links, add hyperlink to the evidencia cell
      const cell = ws.getCell(`I${rowNumber}`);
      cell.value = { text: rec.evidencia, hyperlink: rec.evidencia } as any;
    }
  }

  // Optional: add data validation lists for some columns
  const lastRow = records.length + 1;
  if (lastRow > 1) {
    // Actor (B)
    ws.getColumn('actor').eachCell((cell, rowNumber) => {
      if (rowNumber > 1) {
        // no direct per-cell dataValidation in exceljs easily; skipping per-cell validation for brevity
      }
    });
  }

  const buf = await workbook.xlsx.writeBuffer();
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function downloadExcel(records: TestRecord[], filename = 'registro-bugs') {
  const blob = await exportToExcel(records);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

