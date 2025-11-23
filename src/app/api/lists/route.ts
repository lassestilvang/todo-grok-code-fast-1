import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const lists = await prisma.list.findMany({
      include: {
        tasks: {
          select: {
            status: true,
            dueDate: true
          }
        },
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    const formattedLists = lists.map(list => {
      const overdueCount = list.tasks.filter(task =>
        task.dueDate &&
        task.dueDate < new Date() &&
        task.status !== 'COMPLETED'
      ).length

      return {
        id: list.id.toString(),
        name: list.name,
        color: list.color,
        emoji: list.emoji,
        taskCount: list._count.tasks,
        overdueCount,
        isDefault: list.isDefault,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt
      }
    })

    return NextResponse.json(formattedLists)
  } catch (error) {
    console.error('Error fetching lists:', error)
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required and must be a non-empty string' }, { status: 400 })
    }

    if (name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters long' }, { status: 400 })
    }

    if (name.trim().length > 50) {
      return NextResponse.json({ error: 'Name must be less than 50 characters long' }, { status: 400 })
    }

    // Validate color format (hex color)
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json({ error: 'Color must be a valid hex color code' }, { status: 400 })
    }

    // Validate emoji (optional)
    if (emoji && typeof emoji !== 'string') {
      return NextResponse.json({ error: 'Emoji must be a string' }, { status: 400 })
    }

    // Validate description (optional)
    if (description && typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string' }, { status: 400 })
    }

    if (description && description.length > 500) {
      return NextResponse.json({ error: 'Description must be less than 500 characters long' }, { status: 400 })
    }
    const body = await request.json()
    const { name, color, emoji, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const list = await prisma.list.create({
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
      id: list.id.toString(),
      name: list.name,
      color: list.color,
      emoji: list.emoji,
      taskCount: list._count.tasks,
      isDefault: list.isDefault,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt
    }

    return NextResponse.json(formattedList, { status: 201 })
  } catch (error) {
    console.error('Error creating list:', error)
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
  }
}