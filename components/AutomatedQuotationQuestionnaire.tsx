import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface Question {
    id: string;
    question: string;
    placeholder: string;
    type: 'text' | 'textarea' | 'select';
    options?: string[];
    optionLabels?: { [key: string]: string };
}

interface QuestionnaireProps {
    questions: Question[];
    currentQuestionIndex: number;
    currentAnswer: string;
    answers: { [key: string]: string };
    isGenerating: boolean;
    generationProgress: number;
    onAnswerChange: (value: string) => void;
    onNext: () => void;
    onPrevious: () => void;
    onSkip: () => void;
    onBack: () => void;
    onCompanySelect?: (value: string) => void;
}

export default function AutomatedQuotationQuestionnaire({
    questions,
    currentQuestionIndex,
    currentAnswer,
    answers,
    isGenerating,
    generationProgress,
    onAnswerChange,
    onNext,
    onPrevious,
    onSkip,
    onBack,
    onCompanySelect
}: QuestionnaireProps) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <>
            <div className="flex min-h-screen flex-col">
                <Navbar />

                <main className="flex-1 bg-gradient-to-br from-teal-500/10 via-background to-cyan-500/10">
                    <section className="py-12 border-b">
                        <div className="container px-4">
                            <Button
                                onClick={onBack}
                                variant="ghost"
                                className="mb-6"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Selection
                            </Button>
                            <div className="text-center max-w-3xl mx-auto">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 mb-6">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                                    AI-Powered Quotation
                                </h1>
                                <p className="text-lg text-muted-foreground">
                                    Answer a few questions and let AI create your quotation
                                </p>
                            </div>
                        </div>
                    </section>

                    {!isGenerating ? (
                        <section className="py-16">
                            <div className="container px-4">
                                <div className="max-w-3xl mx-auto">
                                    {/* Progress Bar */}
                                    <div className="mb-8">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-muted-foreground">
                                                Question {currentQuestionIndex + 1} of {questions.length}
                                            </span>
                                            <span className="text-sm font-medium text-teal-600">
                                                {Math.round(progress)}% Complete
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    </div>

                                    {/* Question Card */}
                                    <motion.div
                                        key={currentQuestionIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Card className="p-8 border-2 border-teal-500/20 shadow-lg">
                                            <div className="mb-6">
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold flex-shrink-0">
                                                        {currentQuestionIndex + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h2 className="text-2xl font-bold text-foreground mb-2">
                                                            {currentQuestion.question}
                                                        </h2>
                                                        {currentQuestionIndex === questions.length - 1 && (
                                                            <p className="text-sm text-muted-foreground italic">
                                                                This is optional - you can skip if not applicable
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                {currentQuestion.type === 'textarea' ? (
                                                    <Textarea
                                                        value={currentAnswer}
                                                        onChange={(e) => onAnswerChange(e.target.value)}
                                                        placeholder={currentQuestion.placeholder}
                                                        className="min-h-[150px] text-base"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && e.ctrlKey) {
                                                                onNext();
                                                            }
                                                        }}
                                                    />
                                                ) : currentQuestion.type === 'select' && currentQuestion.options ? (
                                                    <Select
                                                        value={currentAnswer}
                                                        onValueChange={(value) => {
                                                            // Use custom handler for company selection
                                                            if (currentQuestion.id === 'company_name' && onCompanySelect) {
                                                                onCompanySelect(value);
                                                            } else {
                                                                onAnswerChange(value);
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="text-base h-12">
                                                            <SelectValue placeholder={currentQuestion.placeholder} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {currentQuestion.options.map((option) => (
                                                                <SelectItem
                                                                    key={option}
                                                                    value={option}
                                                                    className={`text-base ${option === '__CREATE_NEW__' ? 'text-teal-600 font-semibold border-t mt-1 pt-2' : ''}`}
                                                                >
                                                                    {currentQuestion.optionLabels?.[option] || option}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        type="text"
                                                        value={currentAnswer}
                                                        onChange={(e) => onAnswerChange(e.target.value)}
                                                        placeholder={currentQuestion.placeholder}
                                                        className="text-base"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                onNext();
                                                            }
                                                        }}
                                                    />
                                                )}
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {currentQuestion.type === 'textarea' ? 'Press Ctrl+Enter to continue' : currentQuestion.type === 'select' ? 'Select an option to continue' : 'Press Enter to continue'}
                                                </p>
                                            </div>

                                            {/* Navigation Buttons */}
                                            <div className="flex gap-3 justify-between">
                                                <div className="flex gap-3">
                                                    <Button
                                                        onClick={onPrevious}
                                                        variant="outline"
                                                        disabled={currentQuestionIndex === 0}
                                                        className="gap-2"
                                                    >
                                                        <ArrowLeft className="w-4 h-4" />
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        onClick={onSkip}
                                                        variant="ghost"
                                                        className="text-muted-foreground"
                                                    >
                                                        Skip
                                                    </Button>
                                                </div>
                                                <Button
                                                    onClick={onNext}
                                                    disabled={!currentAnswer.trim()}
                                                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 gap-2"
                                                    size="lg"
                                                >
                                                    {currentQuestionIndex === questions.length - 1 ? (
                                                        <>
                                                            <Sparkles className="w-4 h-4" />
                                                            Generate Quotation
                                                        </>
                                                    ) : (
                                                        <>
                                                            Next
                                                            <ArrowLeft className="w-4 h-4 rotate-180" />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            {/* Answered Questions Summary */}
                                            {Object.keys(answers).length > 0 && (
                                                <div className="mt-6 pt-6 border-t">
                                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                                        Answered Questions: {Object.keys(answers).length}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.keys(answers).map((key, index) => (
                                                            <div
                                                                key={key}
                                                                className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium"
                                                            >
                                                                Q{index + 1} ✓
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    </motion.div>
                                </div>
                            </div>
                        </section>
                    ) : (
                        // Generation Loading State
                        <section className="py-16">
                            <div className="container px-4">
                                <Card className="max-w-2xl mx-auto p-12 text-center border-2 border-teal-500/20">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="inline-block mb-6"
                                    >
                                        <Sparkles className="w-16 h-16 text-teal-500" />
                                    </motion.div>
                                    <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                                        Generating Your Quotation
                                    </h2>
                                    <p className="text-muted-foreground mb-8">
                                        Our AI is analyzing your requirements and creating a professional quotation...
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${generationProgress}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {generationProgress}% Complete
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                        <p className={generationProgress >= 30 ? "text-teal-600 font-medium" : ""}>
                                            {generationProgress >= 30 ? "✓" : "○"} Analyzing requirements...
                                        </p>
                                        <p className={generationProgress >= 60 ? "text-teal-600 font-medium" : ""}>
                                            {generationProgress >= 60 ? "✓" : "○"} Structuring content...
                                        </p>
                                        <p className={generationProgress >= 90 ? "text-teal-600 font-medium" : ""}>
                                            {generationProgress >= 90 ? "✓" : "○"} Finalizing quotation...
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        </section>
                    )}
                </main>

                <Footer />
            </div>
        </>
    );
}
