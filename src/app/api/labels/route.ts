import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const labels = await prisma.label.findMany({
      include: {
        _count: {
          select: { taskLabels: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    const formattedLabels = labels.map(label => ({
      id: label.id.toString(),
      name: label.name,
      color: label.color,
      taskCount: label._count.taskLabels,
      createdAt: label.createdAt
    }))

    return NextResponse.json(formattedLabels)
  } catch (error) {
    console.error('Error fetching labels:', error)
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required and must be a non-empty string' }, { status: 400 })
    }

    if (name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters long' }, { status: 400 })
    }

    if (name.trim().length > 30) {
      return NextResponse.json({ error: 'Name must be less than 30 characters long' }, { status: 400 })
    }

    // Validate color format (hex color)
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json({ error: 'Color must be a valid hex color code' }, { status: 400 })
    }
    const { name, color } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const existingLabel = await prisma.label.findUnique({
      where: { name }
    })

    if (existingLabel) {
      return NextResponse.json({ error: 'Label with this name already exists' }, { status: 409 })
    }

    const label = await prisma.label.create({
      data: {
        name,
        color
      },
      include: {
        _count: {
          select: { taskLabels: true }
        }
      }
    })

    const formattedLabel = {
      id: label.id.toString(),
      name: label.name,
      color: label.color,
      taskCount: label._count.taskLabels,
      createdAt: label.createdAt
    }

    return NextResponse.json(formattedLabel, { status: 201 })
  } catch (error) {
    console.error('Error creating label:', error)
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
  }
}