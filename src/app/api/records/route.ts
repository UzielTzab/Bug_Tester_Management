import { NextRequest, NextResponse } from 'next/server';
import { getAllRecords, addRecord, deleteAllRecords, getRecordsByProject } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    const records = projectId ? await getRecordsByProject(projectId) : await getAllRecords();
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newRecord = await addRecord(body);
    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear registro' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await deleteAllRecords();
    return NextResponse.json({ message: 'Todos los registros han sido eliminados' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar registros' }, { status: 500 });
  }
}
