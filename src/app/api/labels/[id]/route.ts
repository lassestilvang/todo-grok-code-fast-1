import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid label ID' }, { status: 400 })
    }

    const body = await request.json()
    // Server-side validation
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 })
    }

    if (name !== undefined && name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters long' }, { status: 400 })
    }

    if (name !== undefined && name.trim().length > 30) {
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

    const label = await prisma.label.findUnique({
      where: { id }
    })

    if (!label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    // Check if name is already taken by another label
    if (name !== label.name) {
      const existingLabel = await prisma.label.findUnique({
        where: { name }
      })
      if (existingLabel) {
        return NextResponse.json({ error: 'Label with this name already exists' }, { status: 409 })
      }
    }

    const updatedLabel = await prisma.label.update({
      where: { id },
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
      id: updatedLabel.id.toString(),
      name: updatedLabel.name,
      color: updatedLabel.color,
      taskCount: updatedLabel._count.taskLabels,
      createdAt: updatedLabel.createdAt
    }

    return NextResponse.json(formattedLabel)
  } catch (error) {
    console.error('Error updating label:', error)
    return NextResponse.json({ error: 'Failed to update label' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid label ID' }, { status: 400 })
    }

    const label = await prisma.label.findUnique({
      where: { id }
    })

    if (!label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    await prisma.label.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Label deleted successfully' })
  } catch (error) {
    console.error('Error deleting label:', error)
    return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 })
  }
}