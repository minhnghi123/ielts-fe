import apiClient from '@/lib/api';
import type {
    ClassHeatmap,
    ApiResponse,
    ClassAssignment,
    ClassMember,
    ClassPost,
    Classroom,
    Gradebook,
    SubmissionDetail,
    SubmissionRow,
    TeacherDashboard,
} from '../types';

const unwrap = <T,>(r: { data: ApiResponse<T> }) => r.data.data;

export interface Paginated<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreateClassInput {
    name: string;
    description?: string;
    targetBand?: number;
    joinPolicy?: 'open' | 'approval' | 'closed';
    maxMembers?: number;
    coverColor?: string;
}

export interface CreateAssignmentInput {
    testId: string;
    title?: string;
    instructions?: string;
    mode?: 'practice' | 'mock';
    openAt?: string;
    dueAt: string;
    closeAt?: string;
    allowLate?: boolean;
    maxAttempts?: number;
    resultPolicy?: 'immediately' | 'after_due' | 'manual';
}

export const classroomApi = {
    // ── teacher ──
    teacherDashboard: () =>
        apiClient.get<ApiResponse<TeacherDashboard>>('/api/teacher/dashboard').then(unwrap),

    // ── classes ──
    listClasses: (params?: { status?: string; search?: string; page?: number; limit?: number; teacherId?: string }) =>
        apiClient.get<ApiResponse<Paginated<Classroom>>>('/api/classes', { params }).then(unwrap),
    getClass: (id: string) => apiClient.get<ApiResponse<Classroom>>(`/api/classes/${id}`).then(unwrap),
    createClass: (input: CreateClassInput) =>
        apiClient.post<ApiResponse<Classroom>>('/api/classes', input).then(unwrap),
    updateClass: (id: string, input: Partial<CreateClassInput> & { status?: 'active' | 'archived' }) =>
        apiClient.patch<ApiResponse<Classroom>>(`/api/classes/${id}`, input).then(unwrap),
    rotateJoinCode: (id: string) =>
        apiClient.post<ApiResponse<{ joinCode: string }>>(`/api/classes/${id}/join-code/rotate`).then(unwrap),
    joinClass: (code: string) =>
        apiClient
            .post<ApiResponse<{ classId: string; status: string; className: string; alreadyMember: boolean }>>(
                '/api/classes/join',
                { code },
            )
            .then(unwrap),
    leaveClass: (id: string) => apiClient.post(`/api/classes/${id}/leave`).then(() => undefined),
    myUpcomingAssignments: (days = 7) =>
        apiClient.get<ApiResponse<ClassAssignment[]>>('/api/classes/my-assignments', { params: { days } }).then(unwrap),

    // ── members ──
    listMembers: (id: string, status?: string) =>
        apiClient.get<ApiResponse<ClassMember[]>>(`/api/classes/${id}/members`, { params: status ? { status } : {} }).then(unwrap),
    updateMember: (id: string, learnerId: string, input: { status?: 'active' | 'removed'; note?: string }) =>
        apiClient.patch<ApiResponse<ClassMember>>(`/api/classes/${id}/members/${learnerId}`, input).then(unwrap),
    studentProgress: (id: string, learnerId: string) =>
        apiClient
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- aggregated payload from classroom + analytics services
            .get<ApiResponse<Record<string, any>>>(`/api/classes/${id}/students/${learnerId}/progress`)
            .then(unwrap),

    // ── assignments ──
    listAssignments: (id: string, params?: { status?: string; skill?: string }) =>
        apiClient.get<ApiResponse<ClassAssignment[]>>(`/api/classes/${id}/assignments`, { params }).then(unwrap),
    getAssignment: (id: string, aid: string) =>
        apiClient.get<ApiResponse<ClassAssignment>>(`/api/classes/${id}/assignments/${aid}`).then(unwrap),
    createAssignment: (id: string, input: CreateAssignmentInput) =>
        apiClient.post<ApiResponse<ClassAssignment>>(`/api/classes/${id}/assignments`, input).then(unwrap),
    updateAssignment: (id: string, aid: string, input: Partial<CreateAssignmentInput> & { status?: 'open' | 'archived' }) =>
        apiClient.patch<ApiResponse<ClassAssignment>>(`/api/classes/${id}/assignments/${aid}`, input).then(unwrap),
    deleteAssignment: (id: string, aid: string) =>
        apiClient.delete(`/api/classes/${id}/assignments/${aid}`).then(() => undefined),
    releaseResults: (id: string, aid: string) =>
        apiClient.post<ApiResponse<ClassAssignment>>(`/api/classes/${id}/assignments/${aid}/release`).then(unwrap),
    syncAssignment: (id: string, aid: string) =>
        apiClient.post<ApiResponse<{ synced: number }>>(`/api/classes/${id}/assignments/${aid}/sync`).then(unwrap),
    listSubmissions: (id: string, aid: string) =>
        apiClient
            .get<ApiResponse<{ assignment: ClassAssignment; submissions: SubmissionRow[] }>>(
                `/api/classes/${id}/assignments/${aid}/submissions`,
            )
            .then(unwrap),

    // ── weaknesses heatmap & targeted drills (PR5) ──
    heatmap: (id: string) => apiClient.get<ApiResponse<ClassHeatmap>>(`/api/classes/${id}/heatmap`).then(unwrap),
    assignDrill: (id: string, input: { learnerIds: string[]; skill: string; questionType?: string; note?: string }) =>
        apiClient.post<ApiResponse<{ assigned: number; created: number }>>(`/api/classes/${id}/drills`, input).then(unwrap),

    // ── gradebook & review ──
    gradebook: (id: string, skill?: string) =>
        apiClient.get<ApiResponse<Gradebook>>(`/api/classes/${id}/gradebook`, { params: skill ? { skill } : {} }).then(unwrap),
    gradebookCsvUrl: (id: string) => `${apiClient.defaults.baseURL}/api/classes/${id}/gradebook.csv`,
    downloadGradebookCsv: async (id: string, skill?: string) => {
        const r = await apiClient.get<Blob>(`/api/classes/${id}/gradebook.csv`, {
            params: skill ? { skill } : {},
            responseType: 'blob',
        });
        return r.data;
    },
    getSubmission: (id: string, sid: string) =>
        apiClient.get<ApiResponse<SubmissionDetail>>(`/api/classes/${id}/submissions/${sid}`).then(unwrap),
    reviewSubmission: (
        id: string,
        sid: string,
        input: { teacherBand?: number; teacherRubric?: Record<string, number>; teacherFeedback?: string; releaseNow?: boolean },
    ) => apiClient.put<ApiResponse<SubmissionDetail>>(`/api/classes/${id}/submissions/${sid}/review`, input).then(unwrap),

    // ── posts ──
    listPosts: (id: string) => apiClient.get<ApiResponse<ClassPost[]>>(`/api/classes/${id}/posts`).then(unwrap),
    createPost: (id: string, input: { type?: 'announcement' | 'material'; title?: string; body: string; attachments?: { name: string; url: string }[]; pinned?: boolean }) =>
        apiClient.post<ApiResponse<ClassPost>>(`/api/classes/${id}/posts`, input).then(unwrap),
    deletePost: (id: string, pid: string) => apiClient.delete(`/api/classes/${id}/posts/${pid}`).then(() => undefined),
};
