"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AnalysisPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Performance Analysis</h1>
                <Button variant="outline">Download Report</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {["Listening", "Reading", "Writing", "Speaking"].map((skill) => (
                    <Card key={skill}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{skill} Band</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">6.5</div>
                            <p className="text-xs text-muted-foreground">+0.5 from last week</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Score Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed">
                        <p className="text-muted-foreground">Chart Component Placeholder</p>
                        {/* Use Chart.js or Recharts here */}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Weak Areas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            <li className="flex justify-between items-center text-sm">
                                <span>Reading: True/False/NG</span>
                                <span className="text-red-500 font-bold">45%</span>
                            </li>
                            <li className="flex justify-between items-center text-sm">
                                <span>Listening: Map Labelling</span>
                                <span className="text-orange-500 font-bold">60%</span>
                            </li>
                            <li className="flex justify-between items-center text-sm">
                                <span>Writing: Coherence</span>
                                <span className="text-yellow-500 font-bold">6.0</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
