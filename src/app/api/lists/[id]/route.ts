import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid list ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, color, emoji, description } = body
    // Server-side validation
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 })
    }

    if (name !== undefined && name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters long' }, { status: 400 })
    }

    if (name !== undefined && name.trim().length > 50) {
      return NextResponse.json({ error: 'Name must be less than 50 characters long' }, { status: 400 })
    }

    // Validate color format (hex color)
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json({ error: 'Color must be a valid hex color code' }, { status: 400 })
    }

    // Validate emoji (optional)
    if (emoji !== undefined && typeof emoji !== 'string') {
      return NextResponse.json({ error: 'Emoji must be a string' }, { status: 400 })
    }

    // Validate description (optional)
    if (description !== undefined && typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string' }, { status: 400 })
    }

    if (description !== undefined && description.length > 500) {
      return NextResponse.json({ error: 'Description must be less than 500 characters long' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const list = await prisma.list.findUnique({
      where: { id }
    })

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    if (list.isDefault) {
      return NextResponse.json({ error: 'Cannot update default list' }, { status: 403 })
    }

    const updatedList = await prisma.list.update({
      where: { id },
      data: {
        name,
        color,
        emoji,
        description
      },
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    })

    const formattedList = {
      id: updatedList.id.toString(),
      name: updatedList.name,
      color: updatedList.color,
      emoji: updatedList.emoji,
      taskCount: updatedList._count.tasks,
      isDefault: updatedList.isDefault,
      createdAt: updatedList.createdAt,
      updatedAt: updatedList.updatedAt
    }

    return NextResponse.json(formattedList)
  } catch (error) {
    console.error('Error updating list:', error)
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid list ID' }, { status: 400 })
    }

    const list = await prisma.list.findUnique({
      where: { id }
    })

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    if (list.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default list' }, { status: 403 })
    }

    await prisma.list.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'List deleted successfully' })
  } catch (error) {
    console.error('Error deleting list:', error)
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 })
  }
}