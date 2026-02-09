'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Code2,
  Target,
  Users,
  Palette,
  Layout,
  Rocket,
  ShoppingCart,
  BookOpen,
  Briefcase,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  PenTool,
  Settings,
  MessageSquare,
  Star,
  TrendingUp,
  Check,
} from 'lucide-react';

interface BuilderOnboardingProps {
  onComplete: (prefillPrompt: boolean, promptText: string) => void;
}

interface FormData {
  websiteType: string;
  primaryGoal: string;
  audience: string;
  style: string;
  features: string[];
}

const websiteTypes = [
  { value: 'Landing page', icon: Layout, description: 'Single page showcase' },
  { value: 'SaaS product', icon: Code2, description: 'Software application' },
  { value: 'Portfolio', icon: PenTool, description: 'Showcase your work' },
  { value: 'Ecommerce', icon: ShoppingCart, description: 'Sell products online' },
  { value: 'Blog', icon: BookOpen, description: 'Share articles' },
  { value: 'Startup', icon: Rocket, description: 'Modern startup site' },
  { value: 'Agency', icon: Briefcase, description: 'Service agency' },
  { value: 'Mobile App', icon: Smartphone, description: 'App landing page' },
];

const primaryGoals = [
  { value: 'Generate leads', icon: TrendingUp, description: 'Collect contacts & inquiries' },
  { value: 'Sell products', icon: ShoppingCart, description: 'E-commerce sales' },
  { value: 'Build brand awareness', icon: Globe, description: 'Increase visibility' },
  { value: 'Showcase portfolio', icon: Star, description: 'Display work samples' },
  { value: 'Book appointments', icon: MessageSquare, description: 'Schedule meetings' },
  { value: 'Provide information', icon: BookOpen, description: 'Share content & docs' },
];

const audiences = [
  { value: 'Startups & Founders', icon: Rocket },
  { value: 'Small Businesses', icon: Briefcase },
  { value: 'Enterprise Companies', icon: Monitor },
  { value: 'Developers', icon: Code2 },
  { value: 'Designers', icon: PenTool },
  { value: 'General Consumers', icon: Users },
  { value: 'E-commerce Shoppers', icon: ShoppingCart },
  { value: 'Tech Enthusiasts', icon: Zap },
];

const styles = [
  { value: 'Modern & Minimal', color: 'from-slate-600 to-slate-800' },
  { value: 'Bold & Vibrant', color: 'from-orange-500 to-pink-600' },
  { value: 'Dark & Elegant', color: 'from-slate-900 to-purple-900' },
  { value: 'Light & Clean', color: 'from-blue-100 to-white' },
  { value: 'Gradient & Futuristic', color: 'from-purple-600 to-blue-500' },
  { value: 'Professional & Corporate', color: 'from-blue-700 to-blue-900' },
];

const features = [
  { value: 'Hero section', icon: Layout },
  { value: 'Features grid', icon: Settings },
  { value: 'Testimonials', icon: MessageSquare },
  { value: 'Pricing table', icon: TrendingUp },
  { value: 'Contact form', icon: Users },
  { value: 'FAQ section', icon: BookOpen },
  { value: 'Newsletter signup', icon: Star },
  { value: 'Image gallery', icon: PenTool },
  { value: 'Social proof', icon: Globe },
  { value: 'Call to action', icon: Zap },
];

const TOTAL_STEPS = 5;

export default function BuilderOnboarding({ onComplete }: BuilderOnboardingProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    websiteType: '',
    primaryGoal: '',
    audience: '',
    style: '',
    features: [],
  });

  const buildPrompt = useCallback(() => {
    const parts: string[] = [];
    const { websiteType, primaryGoal, audience, style, features: selectedFeatures } = formData;

    if (websiteType) {
      parts.push(`Build a ${websiteType.toLowerCase()} website.`);
    } else {
      parts.push('Build a responsive website.');
    }

    if (primaryGoal) parts.push(`Primary goal: ${primaryGoal}.`);
    if (audience) parts.push(`Target audience: ${audience}.`);
    if (style) parts.push(`Design style: ${style}.`);
    if (selectedFeatures.length > 0) parts.push(`Include sections: ${selectedFeatures.join(', ')}.`);

    parts.push('Use a clean, modern layout with strong typography and spacing. Make it fully responsive with smooth animations.');
    return parts.join(' ');
  }, [formData]);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    onComplete(true, buildPrompt());
  };

  const handleSkip = () => {
    onComplete(false, '');
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.websiteType !== '';
      case 2:
        return formData.primaryGoal !== '';
      default:
        return true;
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Header with Progress */}
      <header className="shrink-0 px-6 py-4 border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Let's build something amazing</h1>
              <p className="text-sm text-slate-400">Step {step} of {TOTAL_STEPS}</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800"
          >
            Skip for now
          </button>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Website Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-8"
              >
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-bold text-white">What are you building?</h2>
                  <p className="text-slate-400 text-lg">Choose the type of website that fits your needs</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {websiteTypes.map(({ value, icon: Icon, description }) => (
                    <button
                      key={value}
                      onClick={() => setFormData({ ...formData, websiteType: value })}
                      className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
                        formData.websiteType === value
                          ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                          : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                      }`}
                    >
                      {formData.websiteType === value && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <Icon className={`w-8 h-8 mb-3 ${
                        formData.websiteType === value ? 'text-orange-400' : 'text-slate-400'
                      }`} />
                      <div className={`font-semibold text-lg ${
                        formData.websiteType === value ? 'text-white' : 'text-slate-300'
                      }`}>
                        {value}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{description}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Primary Goal */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-8"
              >
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-bold text-white">What's your main goal?</h2>
                  <p className="text-slate-400 text-lg">What should this website help you achieve?</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  {primaryGoals.map(({ value, icon: Icon, description }) => (
                    <button
                      key={value}
                      onClick={() => setFormData({ ...formData, primaryGoal: value })}
                      className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
                        formData.primaryGoal === value
                          ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                          : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                      }`}
                    >
                      {formData.primaryGoal === value && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <Icon className={`w-7 h-7 mb-3 ${
                        formData.primaryGoal === value ? 'text-orange-400' : 'text-slate-400'
                      }`} />
                      <div className={`font-semibold ${
                        formData.primaryGoal === value ? 'text-white' : 'text-slate-300'
                      }`}>
                        {value}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{description}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Target Audience */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-8"
              >
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-bold text-white">Who's your audience?</h2>
                  <p className="text-slate-400 text-lg">This helps us tailor the design</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                  {audiences.map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setFormData({ ...formData, audience: value })}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.audience === value
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${
                        formData.audience === value ? 'text-orange-400' : 'text-slate-400'
                      }`} />
                      <span className={`text-sm font-medium text-center ${
                        formData.audience === value ? 'text-white' : 'text-slate-300'
                      }`}>
                        {value}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Style */}
            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-8"
              >
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-bold text-white">Pick a style</h2>
                  <p className="text-slate-400 text-lg">Choose the visual vibe for your site</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  {styles.map(({ value, color }) => (
                    <button
                      key={value}
                      onClick={() => setFormData({ ...formData, style: value })}
                      className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                        formData.style === value
                          ? 'border-orange-500 ring-2 ring-orange-500/20'
                          : 'border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-60`} />
                      <div className="relative z-10 py-4">
                        <span className="font-semibold text-white drop-shadow-lg">{value}</span>
                      </div>
                      {formData.style === value && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center z-10">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 5: Features */}
            {step === 5 && (
              <motion.div
                key="step5"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-8"
              >
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-bold text-white">Select features</h2>
                  <p className="text-slate-400 text-lg">Choose the sections you want (select multiple)</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
                  {features.map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => toggleFeature(value)}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.features.includes(value)
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                      }`}
                    >
                      <div className="relative">
                        <Icon className={`w-5 h-5 ${
                          formData.features.includes(value) ? 'text-orange-400' : 'text-slate-400'
                        }`} />
                        {formData.features.includes(value) && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-medium text-center ${
                        formData.features.includes(value) ? 'text-white' : 'text-slate-400'
                      }`}>
                        {value}
                      </span>
                    </button>
                  ))}
                </div>

                {formData.features.length > 0 && (
                  <p className="text-center text-sm text-slate-400">
                    Selected: {formData.features.length} features
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="shrink-0 px-6 py-4 border-t border-slate-800/50 bg-slate-900/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step > 2 && step < TOTAL_STEPS && (
              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Skip
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${
                  canProceed()
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Start Building
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
