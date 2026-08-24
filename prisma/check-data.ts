import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkData() {
  const locations = await prisma.location.findMany();
  const roomTypes = await prisma.roomType.findMany();
  
  console.log("Locations:", JSON.stringify(locations, null, 2));
  console.log("RoomTypes:", JSON.stringify(roomTypes, null, 2));
  
  await prisma.$disconnect();
}

checkData();
