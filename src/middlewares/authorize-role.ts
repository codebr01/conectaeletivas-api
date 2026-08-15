import { FastifyReply, FastifyRequest } from "fastify";

type Role = "PROFESSOR";

export function authorizeRole(...allowedRoles: Role[]) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const user = request.user as {
      id: string;
      role: Role;
    };

    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({
        message: "Você não possui permissão para acessar este recurso",
      });
    }
  };
}