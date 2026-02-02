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
  Brain
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
    setCurrentProvider(providerName);
    setSearchQuery('');
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
        >
          {getModelIcon(currentModel)}
          <span className="text-sm text-slate-300 truncate max-w-[120px]">
            {currentModel}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                {/* Search */}
                <div className="p-2 border-b border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Provider Tabs */}
                <div className="flex border-b border-slate-700 overflow-x-auto">
                  {PROVIDERS.map((provider) => (
                    <button
                      key={provider.name}
                      onClick={() => handleSelectProvider(provider.name)}
                      className={`flex-1 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                        currentProvider === provider.name
                          ? 'bg-orange-500/10 text-orange-400 border-b-2 border-orange-500'
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                      }`}
                    >
                      {provider.displayName}
                    </button>
                  ))}
                </div>

                {/* Models List */}
                <div className="max-h-64 overflow-y-auto p-2">
                  {filteredModels.length > 0 ? (
                    filteredModels.map((model) => (
                      <button
                        key={model}
                        onClick={() => handleSelectModel(model)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                          currentModel === model
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'hover:bg-slate-700/50 text-slate-300'
                        }`}
                      >
                        {getModelIcon(model)}
                        <span className="text-sm flex-1">{model}</span>
                        {currentModel === model && (
                          <Check className="w-4 h-4 text-orange-400" />
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
          className="appearance-none px-3 py-2 pr-8 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
        >
          {PROVIDERS.map((provider) => (
            <option key={provider.name} value={provider.name}>
              {provider.displayName}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>

      {/* Model Selector */}
      <div className="relative">
        <select
          value={currentModel}
          onChange={(e) => setCurrentModel(e.target.value)}
          className="appearance-none px-3 py-2 pr-8 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
        >
          {currentProviderInfo.models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>
    </div>
  );
}

export default ModelSelector;
