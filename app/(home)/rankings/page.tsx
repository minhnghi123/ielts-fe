export default function RankingsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[40px]">social_leaderboard</span>
      </div>
      <h1 className="text-3xl font-bold mb-4">Global Rankings</h1>
      <p className="text-muted-foreground max-w-lg mb-8">
        See how you stack up against thousands of IELTS learners worldwide. 
        Rankings are updated daily based on your average band score and practice consistency.
      </p>
      
      <div className="p-8 border rounded-xl bg-card shadow-sm w-full max-w-4xl opacity-50 flex items-center justify-center h-64">
        <p className="text-muted-foreground font-medium flex items-center gap-2">
          <span className="material-symbols-outlined">construction</span>
          Rankings engine is currently being generated...
        </p>
      </div>
    </div>
  );
}
