import type { Role } from "@/constants";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  department?: string;
  designation?: string;
  phone?: string;
  profileImage: string;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  isActive: boolean;
  department?: string;
  designation?: string;
  phone?: string;
  joiningDate?: string;
  profileImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  _id: string;
  name: string;
  email: string;
  department?: string;
}