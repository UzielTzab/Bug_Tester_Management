import ExcelJS from 'exceljs';
import { TestRecord } from '@/types';

export async function downloadExcel(records: TestRecord[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Registro de Bugs');

  ws.columns = [
    { header: 'ID', key: 'id', width: 14 },
    { header: 'Actor', key: 'actor', width: 14 },
    { header: 'Módulo / Página', key: 'modulo', width: 22 },
    { header: 'Tipo de Error', key: 'tipoError', width: 18 },
    { header: 'Dispositivo', key: 'device', width: 14 },
    { header: 'Título del Error', key: 'titulo', width: 32 },
    { header: 'Pasos para Reproducir', key: 'pasos', width: 42 },
    { header: 'Resultado Esperado', key: 'resEsperado', width: 32 },
    { header: 'Resultado Actual', key: 'resActual', width: 32 },
    { header: 'Evidencias', key: 'evidencia', width: 14 },
    { header: 'Estado', key: 'estado', width: 14 },
    { header: 'Notas Dev', key: 'notas', width: 32 },
    { header: 'Fecha Creación', key: 'fecha', width: 18 },
  ];

  // Estilo para header
  const headerFont = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  const headerFill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  const headerAlignment = { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true };

  ws.getRow(1).font = headerFont;
  ws.getRow(1).fill = headerFill as any;
  ws.getRow(1).alignment = headerAlignment as any;
  ws.getRow(1).height = 24;

  // Agregar datos sin imágenes
  for (const rec of records) {
    const evidenciaCount = rec.evidencia && rec.evidencia.length > 0 ? rec.evidencia.length : 0;
    const row = ws.addRow({
      id: rec.id,
      actor: rec.actor || '',
      modulo: rec.modulo || '',
      tipoError: rec.tipoError || '',
      device: rec.device || '',
      titulo: rec.titulo || '',
      pasos: rec.pasosReproducir || '',
      resEsperado: rec.resultadoEsperado || '',
      resActual: rec.resultadoActual || '',
      evidencia: evidenciaCount > 0 ? `${evidenciaCount} archivo${evidenciaCount !== 1 ? 's' : ''}` : 'Sin evidencia',
      estado: rec.estado || '',
      notas: rec.notasDev || '',
      fecha: rec.fechaCreacion ? new Date(rec.fechaCreacion).toLocaleDateString('es-ES') : '',
    });

    // Estilos para las filas de datos
    row.font = { size: 10 };
    row.alignment = { vertical: 'top' as const, wrapText: true } as any;
    row.height = 30;

    // Colorear celdas de estado
    const estadoCell = row.getCell(11);
    if (rec.estado === 'Corregido') {
      estadoCell.fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } } as any;
      estadoCell.font = { bold: true, color: { argb: 'FF006100' } };
    } else if (rec.estado === 'En Progreso') {
      estadoCell.fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } } as any;
      estadoCell.font = { bold: true, color: { argb: 'FF9C6500' } };
    } else if (rec.estado === 'Pendiente') {
      estadoCell.fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } } as any;
      estadoCell.font = { bold: true, color: { argb: 'FF9C0006' } };
    }
    estadoCell.alignment = { horizontal: 'center' as const, vertical: 'middle' as const } as any;
  }

  // Aplicar bordes a todas las celdas
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      };
    });
  });

  // Descargar el archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `bugs-report-${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
}

