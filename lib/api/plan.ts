import apiClient from '@/lib/api';
import type { ApiResponse, StudyTask, TodayView, WeekPlan } from '@/lib/types';

export const planApi = {
    getWeek: (learnerId: string) =>
        apiClient.get<ApiResponse<WeekPlan>>(`/api/analytics/plan/${learnerId}`).then((r) => r.data.data),
    regenerate: (learnerId: string) =>
        apiClient.post<ApiResponse<WeekPlan>>(`/api/analytics/plan/${learnerId}/regenerate`).then((r) => r.data.data),
    setDone: (taskId: string, done: boolean, resultRef?: string) =>
        apiClient
            .patch<ApiResponse<StudyTask>>(`/api/analytics/plan/tasks/${taskId}/done`, { done, resultRef })
            .then((r) => r.data.data),
    getToday: (learnerId: string) =>
        apiClient.get<ApiResponse<TodayView>>(`/api/analytics/today/${learnerId}`).then((r) => r.data.data),
};
