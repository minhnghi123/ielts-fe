"use client";

import Link from "next/link";

const RESOURCES = [
  {
    skill: "Listening",
    icon: "headphones",
    color: "from-blue-500 to-cyan-500",
    light: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    items: [
      {
        title: "BBC 6 Minute English",
        description: "Short audio episodes with transcripts. Perfect for building listening stamina and vocabulary.",
        url: "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english",
        tag: "Free",
      },
      {
        title: "IELTS Listening Practice (British Council)",
        description: "Official-style listening samples from the test maker. Includes audio and answer explanations.",
        url: "https://learnenglish.britishcouncil.org/skills/listening",
        tag: "Free",
      },
      {
        title: "TED Talks",
        description: "Listen to expert speakers on academic topics — great for IELTS Section 4 practice.",
        url: "https://www.ted.com",
        tag: "Free",
      },
      {
        title: "IELTS Liz – Listening Tips",
        description: "Comprehensive tips and techniques for all four listening section types.",
        url: "https://ieltsliz.com/ielts-listening/",
        tag: "Guide",
      },
    ],
  },
  {
    skill: "Reading",
    icon: "menu_book",
    color: "from-purple-500 to-violet-500",
    light: "bg-purple-50 border-purple-200",
    text: "text-purple-700",
    items: [
      {
        title: "The Guardian – Science & Technology",
        description: "Read authentic long-form articles in the register used in IELTS Academic passages.",
        url: "https://www.theguardian.com/science",
        tag: "Free",
      },
      {
        title: "Cambridge IELTS Books (1–18)",
        description: "The gold standard. Use real past papers to practice under timed conditions.",
        url: "https://www.amazon.com/s?k=cambridge+ielts",
        tag: "Book",
      },
      {
        title: "IELTS Advantage – Reading Strategies",
        description: "Skimming, scanning, and detailed reading techniques explained with worked examples.",
        url: "https://www.ieltsadvantage.com/ielts-reading/",
        tag: "Guide",
      },
      {
        title: "New Scientist Magazine",
        description: "Academic science articles that match the reading level and topic range of real IELTS passages.",
        url: "https://www.newscientist.com",
        tag: "Free",
      },
    ],
  },
  {
    skill: "Writing",
    icon: "edit_note",
    color: "from-orange-500 to-amber-500",
    light: "bg-orange-50 border-orange-200",
    text: "text-orange-700",
    items: [
      {
        title: "IELTS Writing Task 2 Band Descriptors",
        description: "The official marking criteria — know exactly what examiners look for in each band.",
        url: "https://www.ielts.org/ielts-for-organisations/ielts-scoring-in-detail",
        tag: "Official",
      },
      {
        title: "Simon's IELTS Writing (ieltssimonfree.com)",
        description: "Model essays, vocabulary lessons, and daily practice tasks from a former examiner.",
        url: "https://www.ieltssimonfree.com/p/writing.html",
        tag: "Free",
      },
      {
        title: "Grammarly",
        description: "Use to check grammar and punctuation in your practice essays before reviewing.",
        url: "https://www.grammarly.com",
        tag: "Tool",
      },
      {
        title: "IELTS Liz – Task 1 & Task 2",
        description: "Separate guides for Academic and General Training Task 1, plus full model Task 2 essays.",
        url: "https://ieltsliz.com/ielts-writing/",
        tag: "Guide",
      },
    ],
  },
  {
    skill: "Speaking",
    icon: "mic",
    color: "from-pink-500 to-rose-500",
    light: "bg-pink-50 border-pink-200",
    text: "text-pink-700",
    items: [
      {
        title: "IELTS Speaking Part 2 – Cue Card Practice",
        description: "350+ cue card topics with sample answers. Practice timing yourself for the 1-2 minute response.",
        url: "https://ieltsliz.com/ielts-speaking-part-2/",
        tag: "Free",
      },
      {
        title: "Elsa Speak App",
        description: "AI-powered pronunciation coach. Identifies specific phoneme errors and tracks improvement.",
        url: "https://elsaspeak.com",
        tag: "App",
      },
      {
        title: "IELTS Speaking Band Descriptors",
        description: "Official criteria for Fluency, Lexical Resource, Grammar, and Pronunciation — with examples.",
        url: "https://www.ielts.org/ielts-for-organisations/ielts-scoring-in-detail",
        tag: "Official",
      },
      {
        title: "Shadowing Technique Guide",
        description: "Learn to shadow native speakers to improve fluency and natural rhythm of English speech.",
        url: "https://www.fluentu.com/blog/english/english-shadowing/",
        tag: "Technique",
      },
    ],
  },
];

const TAG_COLORS: Record<string, string> = {
  Free:      "bg-emerald-100 text-emerald-700",
  Guide:     "bg-blue-100 text-blue-700",
  Official:  "bg-purple-100 text-purple-700",
  Book:      "bg-orange-100 text-orange-700",
  App:       "bg-pink-100 text-pink-700",
  Tool:      "bg-amber-100 text-amber-700",
  Technique: "bg-teal-100 text-teal-700",
};

export default function ResourcesPage() {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full flex flex-col gap-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Study Resources</h1>
        <p className="text-sm text-muted-foreground">
          Hand-picked materials to boost every IELTS skill — all trusted by successful candidates.
        </p>
      </div>

      {/* AI Coach CTA */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-700 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span className="text-xs font-bold uppercase tracking-wider">Personalised guidance</span>
          </div>
          <p className="font-bold text-lg">Not sure where to start?</p>
          <p className="text-sm opacity-80">
            Ask the AI Coach to build a custom study plan based on your actual test results.
          </p>
        </div>
        <Link
          href="/ai-advisor"
          className="shrink-0 flex items-center gap-2 bg-white text-purple-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-purple-50 transition-colors shadow"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          Get My Study Plan
        </Link>
      </div>

      {/* Resource sections by skill */}
      {RESOURCES.map(({ skill, icon, color, light, text, items }) => (
        <div key={skill}>
          {/* Skill heading */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
              <span className="material-symbols-outlined text-white text-[18px]">{icon}</span>
            </div>
            <h2 className="text-lg font-bold">{skill}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map(({ title, description, url, tag }) => (
              <a
                key={title}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex flex-col gap-3 border ${light} rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 bg-white`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-bold text-sm group-hover:underline ${text}`}>{title}</h3>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${TAG_COLORS[tag] ?? "bg-slate-100 text-slate-600"}`}>
                    {tag}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                <div className={`flex items-center gap-1 text-xs font-semibold ${text} mt-auto`}>
                  <span>Open resource</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}

      {/* Bottom CTA */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Ready to put your study into practice?
        </p>
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow"
        >
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
          Take a Practice Test
        </Link>
      </div>

    </div>
  );
}
