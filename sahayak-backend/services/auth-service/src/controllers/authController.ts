import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@sahayak/database';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      profileId: user.profile?.id,
      role: user.profile?.role,
    };

    const expiresIn = rememberMe ? '30d' : '1d';
    const token = jwt.sign({ user: sessionUser }, JWT_SECRET, { expiresIn });

    // Set cookie if needed, or just return token. API Gateway can handle it or frontend can set it.
    // For now, let's return token to be flexible.
    return res.status(200).json({ success: true, user: sessionUser, token });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        profile: {
          create: {
            firstName,
            lastName,
            role: role || 'elderly'
          }
        }
      },
      include: { profile: true }
    });

    const sessionUser = {
      id: newUser.id,
      email: newUser.email,
      profileId: newUser.profile?.id,
      role: newUser.profile?.role,
    };

    const token = jwt.sign({ user: sessionUser }, JWT_SECRET, { expiresIn: '1d' });

    return res.status(201).json({ success: true, user: sessionUser, token });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    // Expected to have been attached by an auth middleware on the API Gateway
    const authHeader = req.headers.authorization;
    if (!authHeader) {
       return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.user.id },
      include: { profile: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    
    return res.status(200).json({ user: {
      id: user.id,
      email: user.email,
      profileId: user.profile?.id,
      role: user.profile?.role
    }});
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
