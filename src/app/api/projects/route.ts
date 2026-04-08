import { NextRequest, NextResponse } from 'next/server';
import { addProject, createProjectWithId, getProjects } from '@/lib/db';

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener proyectos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.id) {
      const created = await createProjectWithId(body.id, {
        name: body.name,
        description: body.description || '',
        color: body.color,
        icon: body.icon,
        actors: Array.isArray(body.actors) ? body.actors : [],
      });
      return NextResponse.json(created, { status: 201 });
    }

    const created = await addProject({
      name: body.name,
      description: body.description || '',
      color: body.color,
      icon: body.icon,
      actors: Array.isArray(body.actors) ? body.actors : [],
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 });
  }
}
