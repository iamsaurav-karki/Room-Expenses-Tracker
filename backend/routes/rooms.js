import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all rooms
router.get('/', async (req, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        members: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            expenses: true,
            members: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(rooms);
  } catch (error) {
    next(error);
  }
});

// Get room by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        members: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        expenses: {
          include: {
            expensePayments: {
              include: { member: true }
            },
            expenseShares: {
              include: { member: true }
            }
          },
          orderBy: { expenseDate: 'desc' }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    next(error);
  }
});

// Create room
router.post('/', async (req, res, next) => {
  try {
    const { name, currencyCode = 'USD' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const room = await prisma.room.create({
      data: {
        name,
        currencyCode
      }
    });

    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
});

// Update room
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, currencyCode } = req.body;

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(currencyCode && { currencyCode })
      }
    });

    res.json(room);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Room not found' });
    }
    next(error);
  }
});

// Delete room
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.room.delete({
      where: { id }
    });
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Room not found' });
    }
    next(error);
  }
});

export default router;

