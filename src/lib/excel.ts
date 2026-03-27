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
    { header: 'Estado', key: 'estado', width: 14 },
    { header: 'Fecha Creación', key: 'fecha', width: 18 },
    { header: 'Responsable', key: 'responsable', width: 18 },
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
    const row = ws.addRow({
      id: rec.id,
      actor: rec.actor || '',
      modulo: rec.modulo || '',
      tipoError: rec.tipoError || '',
      device: rec.device || '',
      titulo: rec.titulo || '',
      estado: rec.estado || '',
      fecha: rec.fechaCreacion ? new Date(rec.fechaCreacion).toLocaleDateString('es-ES') : '',
      responsable: '',
    });

    // Estilos para las filas de datos
    row.font = { size: 10 };
    row.alignment = { vertical: 'top' as const, wrapText: true } as any;
    row.height = 30;

    // Colorear celdas de estado (columna 7)
    const estadoCell = row.getCell(7);
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

