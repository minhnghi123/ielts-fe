import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { planApi } from '@/lib/api/plan';

const keys = {
    week: (id: string) => ['plan', 'week', id] as const,
    today: (id: string) => ['plan', 'today', id] as const,
};

export function useWeekPlan(learnerId: string | undefined) {
    return useQuery({
        queryKey: keys.week(learnerId ?? ''),
        queryFn: () => planApi.getWeek(learnerId!),
        enabled: !!learnerId,
        staleTime: 60_000,
    });
}

export function useToday(learnerId: string | undefined) {
    return useQuery({
        queryKey: keys.today(learnerId ?? ''),
        queryFn: () => planApi.getToday(learnerId!),
        enabled: !!learnerId,
        staleTime: 60_000,
    });
}

export function useRegeneratePlan(learnerId: string | undefined) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => planApi.regenerate(learnerId!),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['plan'] }),
    });
}

export function useSetTaskDone(learnerId: string | undefined) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, done }: { id: string; done: boolean }) => planApi.setDone(id, done),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['plan'] });
            if (learnerId) qc.invalidateQueries({ queryKey: ['analytics', 'dashboard', learnerId] });
        },
    });
}
