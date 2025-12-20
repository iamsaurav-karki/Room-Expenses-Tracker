import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get monthly summary
router.get('/room/:roomId/monthly', async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { year, month } = req.query;

    const startDate = year && month 
      ? new Date(parseInt(year), parseInt(month) - 1, 1)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const endDate = year && month
      ? new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where: {
        roomId,
        expenseDate: {
          gte: startDate,
          lte: endDate
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

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => {
      const paid = exp.expensePayments.reduce((s, p) => s + parseFloat(p.paidAmount), 0);
      return sum + paid;
    }, 0);

    // Member-wise totals
    const memberTotals = {};
    const members = await prisma.member.findMany({
      where: { roomId, isActive: true }
    });

    members.forEach(member => {
      memberTotals[member.id] = {
        memberId: member.id,
        memberName: member.fullName,
        totalPaid: 0,
        totalOwed: 0
      };
    });

    expenses.forEach(expense => {
      expense.expensePayments.forEach(payment => {
        if (payment.memberId && memberTotals[payment.memberId]) {
          memberTotals[payment.memberId].totalPaid += parseFloat(payment.paidAmount);
        }
      });

      expense.expenseShares.forEach(share => {
        if (memberTotals[share.memberId]) {
          memberTotals[share.memberId].totalOwed += parseFloat(share.owedAmount);
        }
      });
    });

    res.json({
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      totalExpenses,
      expenseCount: expenses.length,
      memberTotals: Object.values(memberTotals),
      expenses
    });
  } catch (error) {
    next(error);
  }
});

// Get category-wise summary
router.get('/room/:roomId/categories', async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { year, month } = req.query;

    const startDate = year && month 
      ? new Date(parseInt(year), parseInt(month) - 1, 1)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const endDate = year && month
      ? new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where: {
        roomId,
        expenseDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        expensePayments: true
      }
    });

    // Group by category
    const categoryTotals = {};
    expenses.forEach(expense => {
      const totalPaid = expense.expensePayments.reduce(
        (sum, p) => sum + parseFloat(p.paidAmount),
        0
      );

      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = {
          category: expense.category,
          totalAmount: 0,
          expenseCount: 0
        };
      }

      categoryTotals[expense.category].totalAmount += totalPaid;
      categoryTotals[expense.category].expenseCount += 1;
    });

    const categoryArray = Object.values(categoryTotals).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    res.json({
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      categories: categoryArray
    });
  } catch (error) {
    next(error);
  }
});

// Get monthly trends (for charts)
router.get('/room/:roomId/trends', async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { months = 6 } = req.query;

    const monthsBack = parseInt(months);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);
    startDate.setDate(1);

    const expenses = await prisma.expense.findMany({
      where: {
        roomId,
        expenseDate: {
          gte: startDate
        }
      },
      include: {
        expensePayments: true
      },
      orderBy: { expenseDate: 'asc' }
    });

    // Group by month
    const monthlyData = {};
    expenses.forEach(expense => {
      const monthKey = `${expense.expenseDate.getFullYear()}-${String(expense.expenseDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          totalAmount: 0,
          expenseCount: 0
        };
      }

      const totalPaid = expense.expensePayments.reduce(
        (sum, p) => sum + parseFloat(p.paidAmount),
        0
      );
      monthlyData[monthKey].totalAmount += totalPaid;
      monthlyData[monthKey].expenseCount += 1;
    });

    const trends = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      trends,
      period: {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get dashboard overview
router.get('/room/:roomId/dashboard', async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { year, month } = req.query;

    // Get month expenses (default to current month if not specified)
    let startOfMonth, endOfMonth;
    if (year && month) {
      startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    } else {
      const now = new Date();
      startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const [room, members, currentMonthExpenses, allExpenses] = await Promise.all([
      prisma.room.findUnique({ where: { id: roomId } }),
      prisma.member.findMany({ where: { roomId, isActive: true } }),
      prisma.expense.findMany({
        where: {
          roomId,
          expenseDate: { gte: startOfMonth, lte: endOfMonth }
        },
        include: { expensePayments: true }
      }),
      prisma.expense.findMany({
        where: { roomId },
        include: { expensePayments: true }
      })
    ]);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Calculate totals
    const currentMonthTotal = currentMonthExpenses.reduce((sum, exp) => {
      return sum + exp.expensePayments.reduce((s, p) => s + parseFloat(p.paidAmount), 0);
    }, 0);

    const allTimeTotal = allExpenses.reduce((sum, exp) => {
      return sum + exp.expensePayments.reduce((s, p) => s + parseFloat(p.paidAmount), 0);
    }, 0);

    const averageCostPerPerson = members.length > 0 
      ? currentMonthTotal / members.length 
      : 0;

    res.json({
      room: {
        id: room.id,
        name: room.name,
        currencyCode: room.currencyCode
      },
      stats: {
        totalRoommates: members.length,
        currentMonthTotal,
        allTimeTotal,
        averageCostPerPerson: Math.round(averageCostPerPerson * 100) / 100,
        currentMonthExpenseCount: currentMonthExpenses.length,
        allTimeExpenseCount: allExpenses.length
      },
      members: members.map(m => ({
        id: m.id,
        fullName: m.fullName,
        nickname: m.nickname
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;
