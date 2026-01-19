"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestCard } from "./_components/test-card";

// Mock Data (Giả lập dữ liệu)
const ALL_TESTS = [
  {
    id: 1,
    title: "Cambridge 18 - Test 1 Listening",
    category: "Listening",
    difficulty: "Medium",
    duration: "30 mins",
    questionCount: 40,
    tags: ["Academic", "Recent"],
  },
  {
    id: 2,
    title: "Actual Test Vol 4 - Reading 2",
    category: "Reading",
    difficulty: "Hard",
    duration: "60 mins",
    questionCount: 40,
    tags: ["Scientific", "Nature"],
  },
  {
    id: 3,
    title: "Writing Task 1 - Map Process",
    category: "Writing",
    difficulty: "Easy",
    duration: "20 mins",
    questionCount: 1,
    tags: ["Maps", "Process"],
  },
  {
    id: 4,
    title: "Speaking Part 2 - Describe a Person",
    category: "Speaking",
    difficulty: "Medium",
    duration: "15 mins",
    questionCount: 4,
    tags: ["Person", "Cue Card"],
  },
  {
    id: 5,
    title: "Cambridge 17 - Test 3 Reading",
    category: "Reading",
    difficulty: "Medium",
    duration: "60 mins",
    questionCount: 40,
    tags: ["History", "Tech"],
  },
  {
    id: 6,
    title: "Oxford Practice - Listening 4",
    category: "Listening",
    difficulty: "Hard",
    duration: "30 mins",
    questionCount: 40,
    tags: ["Accent", "Fast"],
  },
] as const;

export default function TestLibraryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Hàm lọc đơn giản
  const filterTests = (category: string) => {
    return ALL_TESTS.filter((test) => {
      const matchesCategory = category === "All" || test.category === category;
      const matchesSearch = test.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Practice Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Explore over 500+ mock tests and practice questions.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-[300px]">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-muted-foreground text-[20px]">
              search
            </span>
            <Input
              placeholder="Search tests..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="hidden md:flex">
            <span className="material-symbols-outlined mr-2 text-[20px]">
              tune
            </span>{" "}
            Filters
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="All" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-5 mb-8">
          <TabsTrigger value="All">All Tests</TabsTrigger>
          <TabsTrigger value="Listening">Listening</TabsTrigger>
          <TabsTrigger value="Reading">Reading</TabsTrigger>
          <TabsTrigger value="Writing">Writing</TabsTrigger>
          <TabsTrigger value="Speaking">Speaking</TabsTrigger>
        </TabsList>

        {/* Render nội dung cho từng Tab */}
        {["All", "Listening", "Reading", "Writing", "Speaking"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterTests(tab).map((test) => (
                // @ts-ignore
                <TestCard key={test.id} {...test} />
              ))}
            </div>
            {filterTests(tab).length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-2">
                  sentiment_dissatisfied
                </span>
                <p>No tests found matching your criteria.</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
