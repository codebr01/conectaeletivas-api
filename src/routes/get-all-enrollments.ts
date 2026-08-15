// src/routes/get-all-enrollments.ts

import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function getAllEnrollments(app: FastifyInstance) {
  app.get("/enrollments", async (request, reply) => {
    try {
      const enrollments = await prisma.enrollment.findMany({
        orderBy: {
          createdAt: "desc",
        },

        include: {
          student: {
            select: {
              id: true,
              name: true,
              cpf: true,
              course: true,
              series: true,
            },
          },

          elective: {
            select: {
              id: true,
              name: true,
              professorId: true,

              professor: {
                select: {
                  id: true,
                  name: true,
                  user: true,
                },
              },
            },
          },
        },
      });

      return reply.status(200).send({
        enrollments: enrollments.map((enrollment) => ({
          id: enrollment.id,

          nome: enrollment.student.name,
          cpf: enrollment.student.cpf,
          turma: enrollment.student.course,
          serie: enrollment.student.series,

          eletiva: enrollment.elective.name,
          eletivaId: enrollment.elective.id,

          nota: enrollment.grade,

          alunoId: enrollment.student.id,

          professor: enrollment.elective.professor.name,
          professorId: enrollment.elective.professorId,

          createdAt: enrollment.createdAt,
          updatedAt: enrollment.updatedAt,
        })),
      });
    } catch (error) {
      console.error("Erro ao buscar inscrições:", error);

      return reply.status(500).send({
        message: "Não foi possível buscar as inscrições.",
      });
    }
  });
}