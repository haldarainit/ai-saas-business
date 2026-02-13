'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Check, 
  Search,
  Zap,
  Sparkles,
  Bot,
  Brain,
  Lock
} from 'lucide-react';
import { useChatStore, PROVIDERS, type ProviderInfo } from '@/lib/stores/chat';

const MODEL_ICONS: Record<string, React.ReactNode> = {
  'gemini': <Sparkles className="w-4 h-4 text-blue-400" />,
  'gpt': <Bot className="w-4 h-4 text-green-400" />,
  'claude': <Brain className="w-4 h-4 text-purple-400" />,
  'llama': <Zap className="w-4 h-4 text-orange-400" />,
  'mixtral': <Zap className="w-4 h-4 text-cyan-400" />
};

const getModelIcon = (model: string) => {
  const key = Object.keys(MODEL_ICONS).find(k => model.toLowerCase().includes(k));
  return key ? MODEL_ICONS[key] : <Bot className="w-4 h-4 text-slate-400" />;
};

interface ModelSelectorProps {
  compact?: boolean;
}

export function ModelSelector({ compact = false }: ModelSelectorProps) {
  const { 
    currentProvider, 
    currentModel, 
    setCurrentProvider, 
    setCurrentModel 
  } = useChatStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentProviderInfo = useMemo(() => {
    return PROVIDERS.find(p => p.name === currentProvider) || PROVIDERS[0];
  }, [currentProvider]);

  const filteredModels = useMemo(() => {
    if (!searchQuery) return currentProviderInfo.models;
    return currentProviderInfo.models.filter(m => 
      m.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentProviderInfo, searchQuery]);

  const handleSelectModel = (model: string) => {
    setCurrentModel(model);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSelectProvider = (providerName: string) => {
    const provider = PROVIDERS.find(p => p.name === providerName);
    if (!provider || !provider.enabled) return;
    
    setCurrentProvider(providerName);
    setSearchQuery('');
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
        >
          {getModelIcon(currentModel)}
          <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
            {currentModel}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)} 
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden dark:bg-slate-800 dark:border-slate-700"
              >
                {/* Search */}
                <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Provider Tabs */}
                <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide dark:border-slate-700">
                  {PROVIDERS.map((provider) => (
                    <button
                      key={provider.name}
                      onClick={() => handleSelectProvider(provider.name)}
                      disabled={!provider.enabled}
                      className={`flex-1 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors relative ${
                        currentProvider === provider.name
                          ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500 dark:bg-orange-500/10 dark:text-orange-400'
                          : provider.enabled 
                            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-700/50'
                            : 'text-slate-400 cursor-not-allowed opacity-60 dark:text-slate-600'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{provider.displayName}</span>
                        {!provider.enabled && (
                          <span className="text-[9px] uppercase tracking-wider bg-slate-200 px-1 rounded text-slate-500 dark:bg-slate-700/50 dark:text-slate-500">Coming Soon</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Models List */}
                <div className="max-h-64 overflow-y-auto p-2">
                  <div className="text-xs font-semibold text-slate-500 px-2 py-1 mb-1">
                     {currentProviderInfo.displayName} Models
                  </div>
                  {filteredModels.length > 0 ? (
                    filteredModels.map((model) => (
                      <button
                        key={model}
                        onClick={() => handleSelectModel(model)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                          currentModel === model
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
                            : 'hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-700/50 dark:text-slate-300'
                        }`}
                      >
                        {getModelIcon(model)}
                        <span className="text-sm flex-1">{model}</span>
                        {currentModel === model && (
                          <Check className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      No models found
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Provider Selector */}
      <div className="relative">
        <select
          value={currentProvider}
          onChange={(e) => handleSelectProvider(e.target.value)}
          className="appearance-none px-3 py-2 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
        >
          {PROVIDERS.map((provider) => (
            <option 
              key={provider.name} 
              value={provider.name}
              disabled={!provider.enabled}
            >
              {provider.displayName} {!provider.enabled ? '(Coming Soon)' : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
      </div>

      {/* Model Selector */}
      <div className="relative">
        <select
          value={currentModel}
          onChange={(e) => setCurrentModel(e.target.value)}
          className="appearance-none px-3 py-2 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
        >
          {currentProviderInfo.models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
      </div>
    </div>
  );
}

export default ModelSelector;
