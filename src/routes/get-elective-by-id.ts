import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export async function getElectiveById(app: FastifyInstance) {
  /**
   * Buscar uma eletiva específica
   */
  app.get("/electives/:electiveId", async (request, reply) => {
    const paramsSchema = z.object({
      electiveId: z.uuid(),
    });

    const params = paramsSchema.safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({
        message: "ID da eletiva inválido",
      });
    }

    const { electiveId } = params.data;

    const elective = await prisma.electives.findUnique({
      where: {
        id: electiveId,
      },

      include: {
        professor: {
          select: {
            id: true,
            name: true,
            user: true,
          },
        },

        enrollments: {
          orderBy: {
            createdAt: "asc",
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
          },
        },
      },
    });

    if (!elective) {
      return reply.status(404).send({
        message: "Eletiva não encontrada",
      });
    }

    return reply.status(200).send({
      elective: {
        id: elective.id,
        name: elective.name,
        professorId: elective.professorId,
        createdAt: elective.createdAt,
        updatedAt: elective.updatedAt,

        limiteVagas: 27,

        inscritos: elective.enrollments.length,

        students: elective.enrollments.map((enrollment) => ({
          enrollmentId: enrollment.id,

          grade: enrollment.grade,

          student: enrollment.student,
        })),
      },
    });
  });

  /**
   * Atualizar nota de um aluno
   */
  app.put(
    "/enrollments/:enrollmentId/grade",
    async (request, reply) => {
      const paramsSchema = z.object({
        enrollmentId: z.uuid(),
      });

      const bodySchema = z.object({
        grade: z
          .number()
          .min(0, "A nota não pode ser menor que 0")
          .max(10, "A nota não pode ser maior que 10")
          .nullable(),
      });

      const params = paramsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.status(400).send({
          message: "ID da inscrição inválido",
        });
      }

      const body = bodySchema.safeParse(request.body);

      if (!body.success) {
        return reply.status(400).send({
          message: "A nota deve estar entre 0 e 10",
        });
      }

      const { enrollmentId } = params.data;
      const { grade } = body.data;

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          id: enrollmentId,
        },
      });

      if (!enrollment) {
        return reply.status(404).send({
          message: "Inscrição não encontrada",
        });
      }

      const updatedEnrollment = await prisma.enrollment.update({
        where: {
          id: enrollmentId,
        },

        data: {
          grade,
        },
      });

      return reply.status(200).send({
        message: "Nota atualizada com sucesso",
        enrollment: updatedEnrollment,
      });
    }
  );
}