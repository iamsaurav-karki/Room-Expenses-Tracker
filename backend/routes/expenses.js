import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const VALID_CATEGORIES = ['rent', 'groceries', 'utilities', 'internet', 'supplies', 'maintenance', 'other'];

// Get all expenses for a room
router.get('/room/:roomId', async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { startDate, endDate, category } = req.query;

    const where = {
      roomId,
      ...(startDate && { expenseDate: { gte: new Date(startDate) } }),
      ...(endDate && { expenseDate: { lte: new Date(endDate) } }),
      ...(category && VALID_CATEGORIES.includes(category) && { category })
    };

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        expensePayments: {
          include: { member: true }
        },
        expenseShares: {
          include: { member: true }
        }
      },
      orderBy: { expenseDate: 'desc' }
    });

    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

// Get expense by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        room: true,
        expensePayments: {
          include: { member: true }
        },
        expenseShares: {
          include: { member: true }
        }
      }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    next(error);
  }
});

// Create expense with payments and shares
router.post('/', async (req, res, next) => {
  try {
    const { roomId, title, description, category, expenseDate, payments, shares } = req.body;

    if (!roomId || !title || !category) {
      return res.status(400).json({ error: 'Room ID, title, and category are required' });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ error: 'At least one payment is required' });
    }

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { members: { where: { isActive: true } } }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Validate payments
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.paidAmount || 0), 0);
    if (totalPaid <= 0) {
      return res.status(400).json({ error: 'Total paid amount must be greater than 0' });
    }

    // Create expense with payments and shares
    const expense = await prisma.expense.create({
      data: {
        roomId,
        title,
        description,
        category,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        expensePayments: {
          create: payments.map(p => ({
            memberId: p.memberId,
            paidAmount: parseFloat(p.paidAmount)
          }))
        },
        expenseShares: {
          create: shares ? shares.map(s => ({
            memberId: s.memberId,
            owedAmount: parseFloat(s.owedAmount || 0)
          })) : []
        }
      },
      include: {
        expensePayments: {
          include: { member: true }
        },
        expenseShares: {
          include: { member: true }
        }
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(404).json({ error: 'Room or member not found' });
    }
    next(error);
  }
});

// Update expense
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, expenseDate, payments, shares } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
      }
      updateData.category = category;
    }
    if (expenseDate) updateData.expenseDate = new Date(expenseDate);

    // Update expense
    const expense = await prisma.expense.update({
      where: { id },
      data: updateData
    });

    // Update payments if provided
    if (payments && Array.isArray(payments)) {
      // Delete existing payments
      await prisma.expensePayment.deleteMany({
        where: { expenseId: id }
      });

      // Create new payments
      if (payments.length > 0) {
        await prisma.expensePayment.createMany({
          data: payments.map(p => ({
            expenseId: id,
            memberId: p.memberId,
            paidAmount: parseFloat(p.paidAmount)
          }))
        });
      }
    }

    // Update shares if provided
    if (shares && Array.isArray(shares)) {
      // Delete existing shares
      await prisma.expenseShare.deleteMany({
        where: { expenseId: id }
      });

      // Create new shares
      if (shares.length > 0) {
        await prisma.expenseShare.createMany({
          data: shares.map(s => ({
            expenseId: id,
            memberId: s.memberId,
            owedAmount: parseFloat(s.owedAmount || 0)
          }))
        });
      }
    }

    // Fetch updated expense
    const updatedExpense = await prisma.expense.findUnique({
      where: { id },
      include: {
        expensePayments: {
          include: { member: true }
        },
        expenseShares: {
          include: { member: true }
        }
      }
    });

    res.json(updatedExpense);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Expense not found' });
    }
    next(error);
  }
});

// Delete expense
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({
      where: { id }
    });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Expense not found' });
    }
    next(error);
  }
});

// Calculate balances for a room
router.get('/room/:roomId/balances', async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { year, month } = req.query;

    // Build date filter if month/year provided
    let dateFilter = {};
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      dateFilter = {
        expenseDate: {
          gte: startDate,
          lte: endDate
        }
      };
    }

    // Get expenses for the room (optionally filtered by month)
    const expenses = await prisma.expense.findMany({
      where: {
        roomId,
        ...dateFilter
      },
      include: {
        expensePayments: {
          include: { member: true }
        },
        expenseShares: {
          include: { member: true }
        }
      }
    });

    // Calculate balances
    const balances = {};
    const members = await prisma.member.findMany({
      where: { roomId, isActive: true }
    });

    // Initialize balances
    members.forEach(member => {
      balances[member.id] = {
        memberId: member.id,
        memberName: member.fullName,
        totalPaid: 0,
        totalOwed: 0,
        balance: 0
      };
    });

    // Calculate totals
    expenses.forEach(expense => {
      expense.expensePayments.forEach(payment => {
        if (payment.memberId && balances[payment.memberId]) {
          balances[payment.memberId].totalPaid += parseFloat(payment.paidAmount);
        }
      });

      expense.expenseShares.forEach(share => {
        if (balances[share.memberId]) {
          balances[share.memberId].totalOwed += parseFloat(share.owedAmount);
        }
      });
    });

    // Calculate final balance (positive = owes money, negative = is owed money)
    Object.values(balances).forEach(balance => {
      balance.balance = balance.totalOwed - balance.totalPaid;
    });

    // Calculate who owes whom
    const whoOwesWhom = [];
    const balanceArray = Object.values(balances);
    
    // Find all debts (positive balances = owes money)
    const debtors = balanceArray.filter(b => b.balance > 0);
    // Find all credits (negative balances = is owed money)
    const creditors = balanceArray.filter(b => b.balance < 0).map(b => ({
      ...b,
      balance: Math.abs(b.balance) // Make positive for easier calculation
    }));

    // Simple settlement algorithm: match debtors with creditors
    for (const debtor of debtors) {
      let remainingDebt = debtor.balance;
      
      for (const creditor of creditors) {
        if (remainingDebt <= 0 || creditor.balance <= 0) break;
        
        const amount = Math.min(remainingDebt, creditor.balance);
        whoOwesWhom.push({
          from: debtor.memberName,
          fromId: debtor.memberId,
          amount: amount,
          to: creditor.memberName,
          toId: creditor.memberId
        });
        
        remainingDebt -= amount;
        creditor.balance -= amount;
      }
    }

    res.json({
      balances: Object.values(balances),
      whoOwesWhom
    });
  } catch (error) {
    next(error);
  }
});

export default router;
