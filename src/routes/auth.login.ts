import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";

export async function login(app: FastifyInstance) {
	app.post('/auth/login', async (request, reply) => {

		const loginBodySchema = z.object({
			user: z.string(),
			password: z.string(),
		});

		const cleanBody = loginBodySchema.safeParse(request.body);

		if (!cleanBody.success) {
			return reply.status(400).send({ message: 'Invalid request body' });
		}

		const { user, password } = cleanBody.data;

		const userExists = await prisma.user.findUnique({
			where: {
				user: user
			}
		})

		if (!userExists) {
			return reply.status(404).send({ message: 'User not found' });
		}

		const passwordMatch = await bcrypt.compare(
      password,
      userExists.password
    );

    if (!passwordMatch) {
      return reply.status(401).send({
        message: "Invalid credentials",
      });
    }

    const token = await reply.jwtSign(
      {
        id: userExists.id,
        user: userExists.user,
        role: userExists.role,
      },
      {
        expiresIn: "7d",
      }
    );

    return reply.status(200).send({
      message: "Login successful",
      token,
      user: {
        id: userExists.id,
        user: userExists.user,
        role: userExists.role,
      },
    });

	});	
}