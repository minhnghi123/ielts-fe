export interface CreateManualTestRequest {
    skill: "reading" | "listening" | "writing" | "speaking";
    title: string;
    isMock: boolean;
    createdBy: string;
    sections: {
        sectionOrder: number;
        passage?: string;
        audioUrl?: string;
        timeLimit?: number;
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
}

export const createManualTest = async (data: CreateManualTestRequest) => {
    const token = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || ''
        : '';

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/tests/manual`, {
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
