export interface Task {
  id: string;
  title: string;
  day: string;
  target: number;
  done: boolean;
  createdAt: string;
}

export interface CreateTaskData {
  title: string;
  day: string;
  target: number;
}

export type UpdateTaskData = Partial<
  Pick<Task, "title" | "target" | "done">
>;