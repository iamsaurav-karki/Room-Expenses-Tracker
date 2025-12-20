import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all members for a room
router.get('/room/:roomId', async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { includeInactive } = req.query;

    const where = {
      roomId,
      ...(includeInactive !== 'true' && { isActive: true })
    };

    const members = await prisma.member.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            expensePayments: true,
            expenseShares: true
          }
        }
      }
    });

    res.json(members);
  } catch (error) {
    next(error);
  }
});

// Get member by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        room: true,
        expensePayments: {
          include: { expense: true }
        },
        expenseShares: {
          include: { expense: true }
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(member);
  } catch (error) {
    next(error);
  }
});

// Create member
router.post('/', async (req, res, next) => {
  try {
    const { roomId, fullName, email, nickname } = req.body;

    if (!roomId || !fullName) {
      return res.status(400).json({ error: 'Room ID and full name are required' });
    }

    if (!email && !nickname) {
      return res.status(400).json({ error: 'Either email or nickname is required' });
    }

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const member = await prisma.member.create({
      data: {
        roomId,
        fullName,
        email,
        nickname
      }
    });

    res.status(201).json(member);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    next(error);
  }
});

// Update member
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, email, nickname, isActive } = req.body;

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(fullName && { fullName }),
        ...(email !== undefined && { email }),
        ...(nickname !== undefined && { nickname }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json(member);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Member not found' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    next(error);
  }
});

// Delete member (soft delete by setting isActive to false)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query;

    if (hardDelete === 'true') {
      await prisma.member.delete({
        where: { id }
      });
      res.json({ message: 'Member permanently deleted' });
    } else {
      const member = await prisma.member.update({
        where: { id },
        data: { isActive: false }
      });
      res.json({ message: 'Member deactivated', member });
    }
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Member not found' });
    }
    next(error);
  }
});

export default router;
