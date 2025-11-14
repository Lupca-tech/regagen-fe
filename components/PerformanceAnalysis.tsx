import React, { useState } from 'react';
import type { PerformanceAnalysis, SEOAnalysis, TikTokAnalysis, FacebookAnalysis } from '../types';
import { ChevronDownIcon, CheckCircleIcon, XCircleIcon, SparkleIcon, WebIcon, TikTokIcon, FacebookIcon } from './Icons';

const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
};

const RadialProgress: React.FC<{ score: number }> = ({ score }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? '#4ade80' : score >= 50 ? '#facc15' : '#f87171';

    return (
        <div className="relative w-28 h-28">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle
                    className="text-zinc-700"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                />
                <circle
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke={color}
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                    className="transform -rotate-90 origin-center transition-all duration-500"
                />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-3xl font-black ${getScoreColor(score)}`}>
                {score}
            </span>
        </div>
    );
};

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 text-left font-semibold"
            >
                <span>{title}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`collapsible-content ${isOpen ? 'visible' : ''}`}>
                <div className="p-3 border-t border-zinc-800 text-zinc-300">
                    {children}
                </div>
            </div>
        </div>
    );
};

const SEOAnalysisCard: React.FC<{ analysis: SEOAnalysis }> = ({ analysis }) => (
    <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 p-4 text-center">
            <RadialProgress score={analysis.score} />
            <div>
                 <h3 className="text-xl font-bold">Overall SEO Score</h3>
                 <p className="text-zinc-400 text-sm">Predicts search engine ranking potential.</p>
            </div>
        </div>
        <div className="space-y-3">
            <CollapsibleSection title={`Headline Strength: ${analysis.headlineStrength.score}/100`}>
                <p className="mb-2">{analysis.headlineStrength.feedback}</p>
                <h5 className="font-bold text-zinc-400 mt-3 mb-2 flex items-center gap-2"><SparkleIcon className="w-4 h-4 text-pink-400" /> Suggestions:</h5>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    {analysis.headlineStrength.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
            </CollapsibleSection>
            <CollapsibleSection title="Keyword Analysis">
                <p><strong>Density for "{analysis.keywordAnalysis.density.toFixed(2)}%":</strong> {analysis.keywordAnalysis.feedback}</p>
            </CollapsibleSection>
            <CollapsibleSection title={`Readability Score: ${analysis.readability.score}/100`}>
                <p>{analysis.readability.feedback}</p>
            </CollapsibleSection>
        </div>
    </div>
);

const TikTokAnalysisCard: React.FC<{ analysis: TikTokAnalysis }> = ({ analysis }) => (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 text-center sm:text-left">
            <RadialProgress score={analysis.hookScore} />
            <div>
                 <h3 className="text-xl font-bold">Hook Score</h3>
                 <p className="text-zinc-400 text-sm">How well the first 3 seconds grab attention.</p>
                 <p className="mt-4 text-lg">Predicted Retention: <span className={`font-bold ${getScoreColor(analysis.predictedRetention)}`}>{analysis.predictedRetention}%</span></p>
            </div>
        </div>
         <div className="space-y-3">
             <CollapsibleSection title="Hook Feedback" defaultOpen>
                 <p>{analysis.hookFeedback}</p>
            </CollapsibleSection>
             <CollapsibleSection title="Retention Feedback">
                 <p>{analysis.retentionFeedback}</p>
            </CollapsibleSection>
        </div>
    </div>
);

const FacebookAnalysisCard: React.FC<{ analysis: FacebookAnalysis }> = ({ analysis }) => (
     <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 p-4 text-center">
            <RadialProgress score={analysis.engagementScore} />
            <div>
                 <h3 className="text-xl font-bold">Engagement Score</h3>
                 <p className="text-zinc-400 text-sm">Predicts potential for likes, comments, and shares.</p>
            </div>
        </div>
         <div className="space-y-3">
            <CollapsibleSection title="Call to Action (CTA)">
                 <div className="flex items-center gap-2">
                    {analysis.ctaPresence.detected ? <CheckCircleIcon className="text-green-400 w-5 h-5" /> : <XCircleIcon className="text-red-400 w-5 h-5" />}
                    <span>{analysis.ctaPresence.feedback}</span>
                 </div>
            </CollapsibleSection>
             <CollapsibleSection title="Sentiment Analysis">
                 <p><strong>{analysis.sentiment.label}</strong> (Score: {analysis.sentiment.score.toFixed(2)})</p>
            </CollapsibleSection>
            <CollapsibleSection title="Post Length">
                 <div className="flex items-center gap-2">
                    {analysis.lengthAnalysis.isOptimal ? <CheckCircleIcon className="text-green-400 w-5 h-5" /> : <XCircleIcon className="text-yellow-400 w-5 h-5" />}
                    <span>{analysis.lengthAnalysis.feedback}</span>
                 </div>
            </CollapsibleSection>
        </div>
    </div>
);


export const PerformanceAnalysisDisplay: React.FC<{ analysis: PerformanceAnalysis }> = ({ analysis }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-b-xl border-t-0 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {analysis.web && (
                     <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><WebIcon className="w-5 h-5 text-purple-400"/> Web/SEO Analysis</h2>
                        <SEOAnalysisCard analysis={analysis.web} />
                    </div>
                )}
                 {analysis.facebook && (
                     <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><FacebookIcon className="w-5 h-5 text-purple-400"/> Facebook Analysis</h2>
                        <FacebookAnalysisCard analysis={analysis.facebook} />
                    </div>
                )}
                {analysis.tiktok && (
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><TikTokIcon className="w-5 h-5 text-purple-400"/> TikTok Analysis</h2>
                        <TikTokAnalysisCard analysis={analysis.tiktok} />
                    </div>
                )}
            </div>
             {!analysis.web && !analysis.facebook && !analysis.tiktok && (
                <div className="text-center py-12 text-zinc-500">
                    <p>No performance analysis available for the selected platforms.</p>
                </div>
            )}
        </div>
    );
};