import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function getProfessors(app: FastifyInstance) {
  app.get("/professors", async (request, reply) => {
    const professors = await prisma.user.findMany({
      where: {
        role: "PROFESSOR",
      },
      select: {
        id: true,
        name: true,
        user: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return reply.send({
      professors,
    });
  });
}