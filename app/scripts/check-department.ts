// scripts/check-department.ts
import { prisma } from '@/lib/prisma';

async function checkDepartment() {
  const users = await prisma.wardUser.findMany({
    select: {
      warduser: true,
      department: true,
    }
  });

  console.log('Current departments:', users);
}

checkDepartment();