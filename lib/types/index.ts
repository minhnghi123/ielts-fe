// ─── Skill Types ──────────────────────────────────────────────────────────────
export type Skill = 'reading' | 'listening' | 'writing' | 'speaking';
export type GradingStatus = 'pending' | 'ai_graded' | 'human_reviewed';
export type TestDifficulty = 'easy' | 'medium' | 'hard';
export type TestStatus = 'draft' | 'published' | 'archived';
export type AttemptStatus = 'in_progress' | 'submitted' | 'expired';
export type UserRole = 'learner' | 'teacher' | 'admin';
export type TeacherStatus = 'pending' | 'approved' | 'rejected';
export type TestVisibility = 'public' | 'private';

/** Official IELTS Academic timings in minutes (used when the server doesn't send one). */
export const SKILL_DURATION_MINUTES: Record<Skill, number> = {
    listening: 30,
    reading: 60,
    writing: 60,
    speaking: 14,
};

// ─── Test Service ─────────────────────────────────────────────────────────────

export interface Test {
    id: string;
    skill: Skill;
    title: string;
    isMock: boolean;
    createdBy: string;
    createdAt: string;
    visibility?: TestVisibility;
    ownerRole?: 'admin' | 'teacher';
    difficulty?: TestDifficulty;
    status?: TestStatus;
    description?: string | null;
    /** Resolved by the server: admin override or official timing */
    durationMinutes?: number;
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
    submittedAt?: string | null;
    status?: AttemptStatus;
    durationSeconds?: number | null;
    /** Server-side deadline (ISO). The client timer only mirrors this. */
    expiresAt?: string | null;
    /** Seconds left, computed by the server at response time */
    remainingSeconds?: number | null;
    draftAnswers?: Record<string, string>;
    lastSavedAt?: string | null;
    isPractice?: boolean;
    assignmentId?: string | null;
    attemptNo?: number;
    rawScore?: number;
    bandScore?: number;
    aiFeedback?: string | null;
    test?: Test;
    questionAttempts?: QuestionAttempt[];
}

export interface LeaderboardEntry {
    rank: number;
    learnerId: string;
    displayName: string;
    avatarUrl?: string | null;
    avgBand: number;
    bestBand: number;
    totalAttempts: number;
    isMe?: boolean;
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

export type GoalSkill = 'listening' | 'reading' | 'writing' | 'speaking';
export type GoalPurpose = 'study_abroad' | 'immigration' | 'work' | 'graduation' | 'other';

export interface LearnerGoalsInput {
    targetOverall: number;
    targetListening?: number | null;
    targetReading?: number | null;
    targetWriting?: number | null;
    targetSpeaking?: number | null;
    /** YYYY-MM-DD or null when not booked */
    examDate?: string | null;
    minutesPerDay: number;
    daysPerWeek: number;
    purpose?: GoalPurpose | null;
}

export interface LearnerGoals {
    learnerId: string;
    targetOverall: number;
    targets: Record<GoalSkill, { target: number; explicit: boolean; current: number | null; gap: number | null }>;
    examDate: string | null;
    daysLeft: number | null;
    weeksLeft: number | null;
    minutesPerDay: number;
    daysPerWeek: number;
    weeklyMinutes: number;
    purpose: GoalPurpose | null;
    updatedAt: string;
}

export interface EvidenceAnchor {
    kind: 'passage' | 'audio';
    paragraph?: number;
    startMs?: number;
    endMs?: number;
    quote?: string;
}

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

// ─── Classroom (teacher role) ─────────────────────────────────────────────────

export type JoinPolicy = 'open' | 'approval' | 'closed';
export type ClassStatus = 'active' | 'archived';
export type MemberStatus = 'pending' | 'active' | 'removed' | 'left';
export type AssignmentMode = 'practice' | 'mock';
export type ResultPolicy = 'immediately' | 'after_due' | 'manual';
export type AssignmentStatus = 'scheduled' | 'open' | 'closed' | 'archived';
export type SubmissionStatus = 'in_progress' | 'submitted' | 'late' | 'expired';

export interface TeacherCard {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    organization: string | null;
}

export interface Classroom {
    id: string;
    teacherId: string;
    name: string;
    description: string | null;
    targetBand: number | null;
    joinCode?: string;
    joinLink?: string;
    joinPolicy: JoinPolicy;
    maxMembers: number | null;
    coverColor: string | null;
    status: ClassStatus;
    createdAt: string;
    updatedAt: string;
    memberCount?: number;
    pendingCount?: number;
    assignmentCount?: number;
    teacher?: TeacherCard | null;
    myMembership?: MemberStatus;
}

export interface ClassMember {
    id: string;
    learnerId: string;
    status: MemberStatus;
    joinedAt: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    email?: string | null;
    currentLevel?: string | null;
    note?: string | null;
    requestedAt?: string;
    stats?: { submitted: number; avgBand: number | null; lastActiveAt: string | null };
}

export interface TestSnapshot {
    title: string;
    skill: Skill;
    difficulty?: TestDifficulty;
    durationMinutes?: number;
    isMock?: boolean;
}

export interface MySubmissionView {
    status: SubmissionStatus | 'missing';
    attemptsUsed: number;
    attemptId: string | null;
    submittedAt: string | null;
    finalBand: number | null;
    teacherReviewed: boolean;
    canStart: boolean;
    canResume: boolean;
    cannotStartReason: string | null;
    canViewResult: boolean;
}

export interface AssignmentStats {
    submitted: number;
    late: number;
    inProgress: number;
    missing: number;
    avgBand: number | null;
    pendingReview: number;
}

export interface ClassAssignment {
    id: string;
    classId: string;
    testId: string;
    testSnapshot: TestSnapshot;
    title: string;
    instructions: string | null;
    mode: AssignmentMode;
    openAt: string | null;
    dueAt: string;
    closeAt: string | null;
    allowLate: boolean;
    maxAttempts: number;
    resultPolicy: ResultPolicy;
    resultsReleasedAt: string | null;
    extraTime: Record<string, number> | null;
    status: AssignmentStatus;
    effectiveCloseAt: string | null;
    resultsVisible: boolean;
    createdAt: string;
    stats?: AssignmentStats;
    mySubmission?: MySubmissionView;
    className?: string;
}

export interface GradebookCell {
    submissionId: string;
    attemptId: string;
    status: SubmissionStatus;
    aiBand: number | null;
    teacherBand: number | null;
    finalBand: number | null;
    rawScore: number | null;
    reviewed: boolean;
    submittedAt: string | null;
}

export interface Gradebook {
    students: {
        learnerId: string;
        fullName: string | null;
        email: string | null;
        avatarUrl: string | null;
        avgBand: number | null;
        completed: number;
    }[];
    assignments: {
        id: string;
        title: string;
        skill: Skill;
        dueAt: string;
        status: AssignmentStatus;
        avgBand: number | null;
        submitted: number;
    }[];
    cells: Record<string, Record<string, GradebookCell>>;
    totalStudents: number;
}

export interface SubmissionRow {
    learnerId: string;
    fullName: string | null;
    email: string | null;
    avatarUrl: string | null;
    attempts: number;
    status: SubmissionStatus | 'missing';
    latest: (GradebookCell & { submissionId: string }) | null;
}

export interface SubmissionDetail {
    id: string;
    assignment: ClassAssignment;
    className: string;
    learnerId: string;
    attemptId: string;
    attemptNo: number;
    status: SubmissionStatus;
    skill: Skill | null;
    startedAt: string | null;
    submittedAt: string | null;
    resultsVisible: boolean;
    pendingMessage?: string;
    rawScore?: number | null;
    aiBand?: number | null;
    teacherBand?: number | null;
    finalBand?: number | null;
    teacherFeedback?: string | null;
    teacherRubric?: Record<string, number> | null;
    reviewedAt?: string | null;
    canReview?: boolean;
    learner?: { fullName: string | null; email: string | null; avatarUrl: string | null };
    attempt?: (Partial<TestAttempt> & { draftAnswers?: Record<string, string>; aiFeedback?: string | null }) | null;
}

export interface ClassPost {
    id: string;
    classId: string;
    authorAccountId: string;
    type: 'announcement' | 'material';
    title: string | null;
    body: string;
    attachments: { name: string; url: string }[] | null;
    pinned: boolean;
    createdAt: string;
}

export interface TeacherDashboard {
    classes: Classroom[];
    totals: { classes: number; students: number; openAssignments: number; pendingReview: number; pendingJoinRequests: number };
    needsAttention: { id: string; classId: string; title: string; skill: Skill; dueAt: string }[];
}

export interface TeacherAccount {
    id: string;
    accountId: string;
    email?: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    accountStatus?: string;
    organization: string | null;
    bio: string | null;
    approvalStatus: TeacherStatus;
    approvedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
}
