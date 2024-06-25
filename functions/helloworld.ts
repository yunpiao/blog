
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

export interface Env {
	DB: DB_NAME,
}



export const onRequest: PagesFunction<Env> = async (context) => {
  // Create a prepared statement with our query

  const adapter = new PrismaD1(context.env.DB);
  const prisma = new PrismaClient({ adapter });
  const allVisitors = await prisma.visit.findMany();
  return new Response(JSON.stringify(allVisitors), {
    headers: { 'Content-Type': 'application/json' },
  });
}

