import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function ReadingTestInterface({
    testId,
    onFinish,
}: {
    testId: string;
    onFinish: () => void;
}) {
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleAnswerChange = (qId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [qId]: value }));
    };

    return (
        <div className="h-full flex flex-col lg:flex-row overflow-hidden">
            {/* LEFT PANEL: READING PASSAGE */}
            <div className="w-full lg:w-1/2 p-6 md:p-10 border-r border-border overflow-y-auto h-full bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Badge variant="outline" className="mb-2">
                        Reading Passage 1
                    </Badge>
                    <h1 className="text-3xl font-serif font-bold text-foreground">
                        The Future of Urban Agriculture
                    </h1>
                    <div className="prose dark:prose-invert prose-lg max-w-none font-serif leading-relaxed text-slate-700 dark:text-slate-300">
                        <p>
                            Urban agriculture is the practice of cultivating, processing, and
                            distributing food in or around urban areas. It is also known as
                            urban farming, urban gardening, or urban horticulture. While it
                            has often been dismissed as a hobby for the environmentally
                            conscious, recent studies suggest it could play a pivotal role in
                            feeding the world's growing urban populations.
                        </p>
                        <p>
                            **A.** Historically, agriculture was an integral part of urban
                            settlements. In the 19th century, urban agriculture was a common
                            feature in cities like Paris and London, where market gardens
                            supplied fresh produce to local residents daily. However, as
                            cities expanded and land values rose, these green spaces were
                            pushed to the peripheries, creating a disconnect between consumers
                            and their food sources.
                        </p>
                        <p>
                            **B.** Today, a resurgence is underway. From rooftop gardens in
                            New York to vertical farms in Singapore, technology is enabling
                            crops to be grown in places previously thought impossible.
                            Hydroponics and aeroponics allow for soil-less cultivation,
                            significantly reducing water usage and eliminating the need for
                            pesticides. This "controlled environment agriculture" ensures
                            year-round production regardless of external weather conditions.
                        </p>
                        <p>
                            **C.** Critics argue that the energy costs associated with
                            artificial lighting and climate control in indoor farms negate the
                            environmental benefits of reduced transport emissions. Indeed, for
                            staple crops like wheat and corn, traditional rural farming
                            remains far more efficient. However, for perishable greens and
                            herbs, the urban model shows immense promise, potentially reducing
                            the carbon footprint of our salads by up to 90%.
                        </p>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: QUESTIONS */}
            <div className="w-full lg:w-1/2 p-6 md:p-10 overflow-y-auto h-full bg-background scroll-smooth">
                <div className="max-w-2xl mx-auto space-y-10">
                    {/* SECTION 1: Matching Headings */}
                    <section className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                            <h3 className="font-bold text-primary mb-2">
                                Questions 1-3: Matching Headings
                            </h3>
                            <p className="text-sm">
                                Choose the correct heading for each paragraph (A-C) from the
                                list of headings below.
                            </p>
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-sm space-y-1">
                            <p className="font-bold mb-2">List of Headings</p>
                            <ul className="list-decimal list-inside space-y-1 text-muted-foreground">
                                <li>The historical context of city farming</li>
                                <li>The pros and cons of modern techniques</li>
                                <li>Defining urban agriculture</li>
                                <li>Technological advancements in farming</li>
                                <li>The future economic impact</li>
                                <li>Energy consumption concerns</li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <QuestionRow
                                id="q1"
                                label="1. Paragraph A"
                                type="select"
                                options={["i", "ii", "iii", "iv", "v", "vi"]}
                                value={answers["q1"]}
                                onChange={handleAnswerChange}
                            />
                            <QuestionRow
                                id="q2"
                                label="2. Paragraph B"
                                type="select"
                                options={["i", "ii", "iii", "iv", "v", "vi"]}
                                value={answers["q2"]}
                                onChange={handleAnswerChange}
                            />
                            <QuestionRow
                                id="q3"
                                label="3. Paragraph C"
                                type="select"
                                options={["i", "ii", "iii", "iv", "v", "vi"]}
                                value={answers["q3"]}
                                onChange={handleAnswerChange}
                            />
                        </div>
                    </section>

                    <hr className="border-border" />

                    {/* SECTION 2: True/False/Not Given */}
                    <section className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                            <h3 className="font-bold text-primary mb-2">
                                Questions 4-6: True / False / Not Given
                            </h3>
                            <p className="text-sm">
                                Do the following statements agree with the information given in
                                the Reading Passage?
                            </p>
                        </div>

                        <div className="space-y-6">
                            <QuestionRow
                                id="q4"
                                label="4. Urban agriculture was virtually non-existent in 19th-century European cities."
                                type="select"
                                options={["TRUE", "FALSE", "NOT GIVEN"]}
                                value={answers["q4"]}
                                onChange={handleAnswerChange}
                            />
                            <QuestionRow
                                id="q5"
                                label="5. Hydroponic systems require significantly more water than traditional farming methods."
                                type="select"
                                options={["TRUE", "FALSE", "NOT GIVEN"]}
                                value={answers["q5"]}
                                onChange={handleAnswerChange}
                            />
                            <QuestionRow
                                id="q6"
                                label="6. Vertical farming in Singapore produces more food per square meter than any other country."
                                type="select"
                                options={["TRUE", "FALSE", "NOT GIVEN"]}
                                value={answers["q6"]}
                                onChange={handleAnswerChange}
                            />
                        </div>
                    </section>

                    <hr className="border-border" />

                    {/* SECTION 3: Multiple Choice */}
                    <section className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                            <h3 className="font-bold text-primary mb-2">
                                Question 7: Multiple Choice
                            </h3>
                            <p className="text-sm">Choose the correct letter, A, B, C or D.</p>
                        </div>

                        <div className="space-y-4">
                            <p className="font-medium">
                                7. According to the text, what is the main drawback of indoor
                                farming for staple crops?
                            </p>
                            <div className="space-y-2 pl-4">
                                {[
                                    "A. It requires too much water.",
                                    "B. The energy costs negate environmental benefits.",
                                    "C. The produce is less nutritious.",
                                    "D. It cannot produce enough quantity.",
                                ].map((opt, i) => (
                                    <label
                                        key={i}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border border-transparent hover:border-border transition-all"
                                    >
                                        <input
                                            type="radio"
                                            name="q7"
                                            value={opt.charAt(0)}
                                            checked={answers["q7"] === opt.charAt(0)}
                                            onChange={(e) => handleAnswerChange("q7", e.target.value)}
                                            className="w-4 h-4 text-primary accent-primary"
                                        />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Submit */}
                    <div className="pt-10 pb-20">
                        <Button
                            className="w-full h-14 text-lg font-bold shadow-lg"
                            onClick={onFinish}
                        >
                            Submit Test Answers
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuestionRow({
    id,
    label,
    type,
    options,
    value,
    onChange,
}: {
    id: string;
    label: string;
    type: "select" | "text";
    options?: string[];
    value?: string;
    onChange: (id: string, val: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="font-medium text-sm md:text-base">
                {label}
            </label>
            {type === "select" && options ? (
                <select
                    id={id}
                    value={value || ""}
                    onChange={(e) => onChange(id, e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="" disabled>
                        Select an answer...
                    </option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            ) : (
                <input type="text" className="border rounded px-3 py-2" />
            )}
        </div>
    );
}
