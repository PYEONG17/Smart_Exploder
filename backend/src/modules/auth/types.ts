import type { Role } from "@prisma/client";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}
