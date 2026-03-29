export interface CreateManualTestRequest {
    skill: "reading" | "listening" | "writing" | "speaking";
    title: string;
    isMock: boolean;
    createdBy: string;
    sections: {
        sectionOrder: number;
        passage?: string;
        audioUrl?: string;
        groups: {
            groupOrder: number;
            instructions?: string;
            questions: {
                questionOrder: number;
                questionType: string;
                questionText: string;
                config: any;
                explanation?: string;
                answer: {
                    correctAnswers: string[];
                    caseSensitive: boolean;
                }
            }[];
        }[];
    }[];
}

export const createManualTest = async (data: CreateManualTestRequest) => {
    const token = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || ''
        : '';

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tests/manual`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        let errMessage = "Failed to create manual test";
        try {
            const errBody = await response.json();
            if (errBody.message) errMessage = Array.isArray(errBody.message) ? errBody.message.join(', ') : errBody.message;
        } catch (e) { }
        throw new Error(errMessage);
    }

    return response.json();
};

// ─── Writing Test ─────────────────────────────────────────────────────────────

export interface WritingRubricItem {
    criterion: string;
    description?: string;
}

export interface WritingTaskItem {
    taskNumber: number;
    promptText: string;
    timeLimit?: number;
    mediaUrl?: string;
    rubric?: WritingRubricItem[];
}

export interface CreateWritingTestRequest {
    title: string;
    isMock: boolean;
    createdBy: string;
    tasks: WritingTaskItem[];
}

const getToken = () =>
    typeof document !== 'undefined'
        ? document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || ''
        : '';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`;

export const createWritingTest = async (data: CreateWritingTestRequest) => {
    const response = await fetch(`${API_BASE}/tests/writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const msg = errBody.message;
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to create writing test');
    }
    return response.json();
};

// ─── Speaking Test ────────────────────────────────────────────────────────────

export interface SpeakingQuestion { questionText: string; audioUrl?: string; }
export interface SpeakingTopic { topicName: string; questions: SpeakingQuestion[]; }
export interface Part1Data { topics: SpeakingTopic[]; }
export interface Part2Data { mainTopic: string; cues: string[]; prepTime?: number; speakTime?: number; }
export interface Part3Data { questions: SpeakingQuestion[]; }

export interface CreateSpeakingTestRequest {
    title: string;
    isMock: boolean;
    createdBy: string;
    part1: Part1Data;
    part2: Part2Data;
    part3: Part3Data;
}

export const createSpeakingTest = async (data: CreateSpeakingTestRequest) => {
    const response = await fetch(`${API_BASE}/tests/speaking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const msg = errBody.message;
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to create speaking test');
    }
    return response.json();
};

export const updateWritingTest = async (id: string, data: Omit<CreateWritingTestRequest, 'createdBy'>) => {
    const response = await fetch(`${API_BASE}/tests/${id}/writing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const msg = errBody.message;
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to update writing test');
    }
    return response.json();
};

export const updateSpeakingTest = async (id: string, data: Omit<CreateSpeakingTestRequest, 'createdBy'>) => {
    const response = await fetch(`${API_BASE}/tests/${id}/speaking`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const msg = errBody.message;
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to update speaking test');
    }
    return response.json();
};
