// ─── Skill Types ──────────────────────────────────────────────────────────────
export type Skill = 'reading' | 'listening' | 'writing' | 'speaking';
export type GradingStatus = 'pending' | 'ai_graded' | 'human_reviewed';

// ─── Test Service ─────────────────────────────────────────────────────────────

export interface Test {
    id: string;
    skill: Skill;
    title: string;
    isMock: boolean;
    createdBy: string;
    createdAt: string;
    sections?: Section[];
    writingTasks?: WritingTask[];
    speakingParts?: SpeakingPart[];
}

export interface Section {
    id: string;
    testId: string;
    sectionOrder: number;
    passage?: string;
    audioUrl?: string;
    timeLimit?: number;
    questions?: Question[];
}

export interface Question {
    id: string;
    sectionId: string;
    questionOrder: number;
    questionType: string;
    questionText: string;
    config: Record<string, any>;
    explanation?: string;
    answer?: QuestionAnswer;
}

export interface QuestionAnswer {
    id: string;
    questionId: string;
    correctAnswers: string[];
    caseSensitive: boolean;
}

export interface WritingTask {
    id: string;
    testId: string;
    taskNumber: number;
    prompt: string;
    wordLimit: number;
}

export interface SpeakingPart {
    id: string;
    testId: string;
    partNumber: number;
    prompt?: string;
}

export interface PaginatedTests {
    data: Test[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ─── Submission Service ───────────────────────────────────────────────────────

export interface TestAttempt {
    id: string;
    learnerId: string;
    testId: string;
    startedAt: string;
    submittedAt?: string;
    rawScore?: number;
    bandScore?: number;
    questionAttempts?: QuestionAttempt[];
}

export interface QuestionAttempt {
    id: string;
    testAttemptId: string;
    questionId: string;
    answer?: string;
    isCorrect?: boolean;
    answeredAt?: string;
}

export interface WritingSubmission {
    id: string;
    learnerId: string;
    writingTaskId: string;
    content: string;
    submittedAt: string;
    overallBand?: number;
    gradingStatus: GradingStatus;
    scores?: WritingScore[];
}

export interface WritingScore {
    id: string;
    submissionId: string;
    criterion: string;
    band: number;
    feedback?: string;
}

export interface SpeakingSubmission {
    id: string;
    learnerId: string;
    speakingPartId: string;
    audioUrl: string;
    transcript?: string;
    submittedAt: string;
    overallBand?: number;
    gradingStatus: GradingStatus;
    scores?: SpeakingScore[];
}

export interface SpeakingScore {
    id: string;
    submissionId: string;
    criterion: string;
    band: number;
    feedback?: string;
}

// ─── Analytics Service ────────────────────────────────────────────────────────

export type BandSkill = Skill | 'overall';

export interface LearnerBandProfile {
    id: string;
    learnerId: string;
    skill: BandSkill;
    currentBand?: number;
    targetBand?: number;
    assessedAt: string;
}

export interface LearnerProgressSnapshot {
    id: string;
    learnerId: string;
    overallBand: number;
    snapshotAt: string;
}

export interface LearnerMistake {
    id: string;
    learnerId: string;
    questionId: string;
    mistakeType?: string;
    createdAt: string;
}

export interface DashboardSummary {
    bandProfiles: LearnerBandProfile[];
    latestOverallBand: number | null;
    progressHistory: LearnerProgressSnapshot[];
    totalMistakes: number;
    mistakesByType: Record<string, number>;
    // Computed convenience fields
    totalAttempts?: number;
    averageBand?: number;
    practiceHours?: number;
    examReadiness?: number;
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
    data: T;
    statusCode: number;
    message: string;
}
