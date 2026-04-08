import { NextRequest, NextResponse } from 'next/server';
import { deleteProject, getProjectById, updateProject } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProjectById(id);

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener proyecto' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await updateProject(id, {
      name: body.name,
      description: body.description,
      color: body.color,
      icon: body.icon,
      actors: body.actors,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar proyecto' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar proyecto' }, { status: 500 });
  }
}
