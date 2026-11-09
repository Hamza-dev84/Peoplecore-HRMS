import { api, toMessage, unwrap } from "@/lib/axios";
import type { Role } from "@/constants";
import type { ApiResponse, PageParams, Pagination } from "@/types/api";
import type { Employee } from "@/types/user";

export interface EmployeeListParams extends PageParams {
  search?: string;
  department?: string;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  department?: string;
  designation?: string;
  phone?: string;
  joiningDate?: string;
  role?: Role;
}

export interface UpdateEmployeePayload {
  name?: string;
  department?: string;
  designation?: string;
  phone?: string;
  joiningDate?: string;
  isActive?: boolean;
}

export interface ProfilePayload {
  name?: string;
  phone?: string;
}

export const employeeService = {
  list: (params?: EmployeeListParams) =>
    api
      .get<ApiResponse<{ employees: Employee[]; pagination: Pagination }>>("/employees", { params })
      .then(unwrap),

  async getDepartments(): Promise<string[]> {
    const data = await api
      .get<ApiResponse<{ departments: string[] }>>("/employees/departments")
      .then(unwrap);
    return data.departments;
  },

  async getById(id: string): Promise<Employee> {
    const data = await api.get<ApiResponse<{ employee: Employee }>>(`/employees/${id}`).then(unwrap);
    return data.employee;
  },

  async create(payload: CreateEmployeePayload) {
    const response = await api.post<ApiResponse<{ employee: Employee; temporaryPassword?: string }>>(
      "/employees",
      payload
    );
    return { ...response.data.data, message: response.data.message };
  },

  async update(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
    const data = await api
      .patch<ApiResponse<{ employee: Employee }>>(`/employees/${id}`, payload)
      .then(unwrap);
    return data.employee;
  },

  deactivate: (id: string) => api.delete<ApiResponse<null>>(`/employees/${id}`).then(toMessage),

  async getProfile(): Promise<Employee> {
    const data = await api.get<ApiResponse<{ user: Employee }>>("/employees/profile").then(unwrap);
    return data.user;
  },

  async updateProfile(payload: ProfilePayload): Promise<Employee> {
    const data = await api
      .patch<ApiResponse<{ user: Employee }>>("/employees/profile", payload)
      .then(unwrap);
    return data.user;
  },

  async uploadProfileImage(file: File): Promise<Employee> {
    const formData = new FormData();
    formData.append("image", file);

    const data = await api
      .patch<ApiResponse<{ user: Employee }>>("/employees/profile/image", formData)
      .then(unwrap);
    return data.user;
  },

  changeRole: (id: string, role: Role) =>
    api
      .patch<ApiResponse<{ user: { id: string; name: string; email: string; role: Role } }>>(
        `/users/${id}/role`,
        { role }
      )
      .then(unwrap),
};