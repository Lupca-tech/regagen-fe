import React from 'react';
import type { AIVisibilitySettings, AIVisibilityResult } from '../../types';
import { CheckCircleIcon, XCircleIcon, MinusCircleIcon } from '../Icons';
import { ActionItemCard } from './ActionItemCard';

// --- SHARED SUB-COMPONENTS ---

const DonutChart: React.FC<{ data: { brand: string; percentage: number }[] }> = ({ data }) => {
    const colors = ['#ec4899', '#a855f7', '#6366f1', '#f97316', '#10b981', '#f59e0b'];
    let cumulativePercentage = 0;
    const segments = data.map((item, index) => {
        const startAngle = cumulativePercentage;
        cumulativePercentage += item.percentage;
        return { ...item, startAngle, color: colors[index % colors.length] };
    });

    const conicGradient = segments.map(s => `${s.color} ${s.startAngle}% ${s.startAngle + s.percentage}%`).join(', ');

    return (
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div 
                className="relative w-48 h-48 rounded-full"
                style={{ background: `conic-gradient(${conicGradient})` }}
                aria-label="Donut chart showing share of voice"
            >
                <div className="absolute inset-2 bg-zinc-900 rounded-full"></div>
            </div>
            <ul className="flex flex-col gap-2">
                {segments.map(item => (
                    <li key={item.brand} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: item.color }} aria-hidden="true"></div>
                        <span className="font-semibold text-zinc-200">{item.brand}:</span>
                        <span className="text-zinc-400">{item.percentage.toFixed(1)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const SentimentIcon: React.FC<{ sentiment: 'positive' | 'neutral' | 'negative' }> = ({ sentiment }) => {
    switch (sentiment) {
        case 'positive': return <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" aria-label="Positive sentiment"/>;
        case 'neutral': return <MinusCircleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" aria-label="Neutral sentiment"/>;
        case 'negative': return <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" aria-label="Negative sentiment"/>;
    }
};

// --- PROPS ---

interface ResultsDashboardProps {
    settings: AIVisibilitySettings;
    result: AIVisibilityResult;
}

// --- MAIN COMPONENT ---

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ settings, result }) => {
    return (
        <div className="space-y-8">
            {result.actionItem && <ActionItemCard item={result.actionItem} />}
            
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-xl font-bold mb-4">Share of Voice</h3>
                <p className="text-zinc-400 mb-6 text-sm">Percentage of times <span className="font-bold text-zinc-200">{settings.brandName}</span> was mentioned vs. competitors for your target keywords.</p>
                <DonutChart data={result.shareOfVoice} />
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-xl font-bold mb-4">Sentiment Analysis for "{settings.brandName}"</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-zinc-800 p-4 rounded-lg flex items-center gap-3">
                        <CheckCircleIcon className="w-8 h-8 text-green-400" />
                        <div>
                            <p className="text-2xl font-bold">{result.sentimentCounts.positive}</p>
                            <p className="text-sm text-zinc-400">Positive Mentions</p>
                        </div>
                    </div>
                    <div className="bg-zinc-800 p-4 rounded-lg flex items-center gap-3">
                        <MinusCircleIcon className="w-8 h-8 text-yellow-400" />
                        <div>
                            <p className="text-2xl font-bold">{result.sentimentCounts.neutral}</p>
                            <p className="text-sm text-zinc-400">Neutral Mentions</p>
                        </div>
                    </div>
                     <div className="bg-zinc-800 p-4 rounded-lg flex items-center gap-3">
                        <XCircleIcon className="w-8 h-8 text-red-400" />
                        <div>
                            <p className="text-2xl font-bold">{result.sentimentCounts.negative}</p>
                            <p className="text-sm text-zinc-400">Negative Mentions</p>
                        </div>
                    </div>
                 </div>
                 {result.sentimentAnalysis.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-zinc-800">
                        <h4 className="font-semibold text-zinc-300 mb-3">Sentiment Breakdown:</h4>
                        <div className="space-y-3">
                            {result.sentimentAnalysis.map((item, index) => (
                                <div key={index} className="bg-zinc-800 p-3 rounded-lg flex items-start gap-3">
                                    <SentimentIcon sentiment={item.sentiment} />
                                    <div>
                                        <p className="font-bold text-zinc-200">{item.brand}</p>
                                        <p className="text-sm text-zinc-400 italic">"{item.reason}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-xl font-bold mb-4">Citation Tracking</h3>
                <p className="text-zinc-400 mb-6 text-sm">Instances where an LLM cited your website (<span className="font-bold text-zinc-200">{settings.domain}</span>) as a source.</p>
                <div className="space-y-4">
                    {result.citationTracking.length > 0 ? result.citationTracking.map((citation, index) => (
                        <div key={index} className="bg-zinc-800 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-sm text-zinc-400">For query: <span className="font-semibold text-zinc-300">"{citation.query}"</span></p>
                                {citation.cited ? (
                                    <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full bg-green-500/10 text-green-400">Cited</span>
                                ) : (
                                    <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full bg-zinc-700 text-zinc-300">Not Cited</span>
                                )}
                            </div>
                            {citation.cited && citation.url && (
                                <>
                                    <a href={citation.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-pink-400 hover:underline break-all">{citation.url}</a>
                                    {citation.snippet && <blockquote className="mt-2 pl-3 border-l-2 border-zinc-600 text-zinc-300 italic">{citation.snippet}</blockquote>}
                                </>
                            )}
                        </div>
                    )) : (
                        <p className="text-zinc-500 text-center py-4">No citation data available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
