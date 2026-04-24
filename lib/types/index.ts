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
    questionGroups?: QuestionGroup[];
}

export interface QuestionGroup {
    id: string;
    sectionId: string;
    groupOrder: number;
    instructions?: string;
    questions?: Question[];
}

export interface Question {
    id: string;
    questionGroupId: string;
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
    config?: {
        // Part 1
        topics?: { topicName: string; questions: { questionText: string }[] }[];
        // Part 2
        cues?: string[];
        prepTime?: number;
        speakTime?: number;
        // Part 3
        questions?: { questionText: string }[];
    };
}

export interface ConversationMessage {
    role: 'examiner' | 'candidate';
    content: string;
}

export interface PartGrading {
    fluency: number;
    lexical: number;
    grammar: number;
    pronunciation: number;
    overall: number;
    suggestions: { criterion: string; feedback: string; improvement: string }[];
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
    test?: Test;
    questionAttempts?: QuestionAttempt[];
}

export interface QuestionAttempt {
    id: string;
    testAttemptId: string;
    questionId: string;
    answer?: string;
    isCorrect?: boolean;
    answeredAt?: string;
    question?: Question;
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
    totalAttempts?: number;
    averageBand?: number;
    practiceHours?: number;
    examReadiness?: number;
    questionTypeMastery?: Array<{
        questionType: string;
        correct: number;
        total: number;
        accuracy: number;
        masteryLevel: 'beginner' | 'developing' | 'proficient' | 'advanced';
    }>;
    adaptiveStudyPlan?: Array<{
        title: string;
        focusArea: string;
        priority: 'high' | 'medium' | 'low';
        dueInDays: number;
        recommendation: string;
    }>;
    rubricBreakdown?: {
        writing: null | {
            submissionId: string;
            submittedAt: string;
            overallBand: number | null;
            criteria: Array<{ criterion: string; band: number; feedback: string | null }>;
        };
        speaking: null | {
            submissionId: string;
            submittedAt: string;
            overallBand: number | null;
            criteria: Array<{ criterion: string; band: number; feedback: string | null }>;
        };
    };
}

// ─── Admin Analytics ──────────────────────────────────────────────────────────

export interface AdminGlobalStats {
    totalLearners: number;
    totalAttempts: number;
    completedAttempts: number;
    averageBand: number;
    attemptsPerDay: Array<{ date: string; count: number }>;
    bandDistribution: Array<{ range: string; count: number; color: string }>;
    skillBreakdown: Array<{ skill: string; avgBand: number; totalAttempts: number }>;
    topLearners: Array<{ learnerId: string; email: string; avgBand: number; totalAttempts: number }>;
    recentActivity: Array<{
        email: string;
        testTitle: string;
        bandScore: number | null;
        submittedAt: string;
    }>;
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
    data: T;
    statusCode: number;
    message: string;
}
