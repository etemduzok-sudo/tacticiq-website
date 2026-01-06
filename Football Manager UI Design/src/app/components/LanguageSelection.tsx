import { motion } from "motion/react";
import { Shield } from "lucide-react";
import { Button } from "./ui/button";

interface LanguageSelectionProps {
  onSelectLanguage: (language: string) => void;
}

export function LanguageSelection({ onSelectLanguage }: LanguageSelectionProps) {
  const languages = [
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] flex items-center justify-center px-4 py-8 relative">
      {/* Footer - Absolute Position - Same as All Pages */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-xs text-gray-500">© 2026 Fan Manager. Tüm hakları saklıdır.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-16">
          <Shield className="w-32 h-32 text-[#F59E0B] mb-6" strokeWidth={1} />
          <h1 className="text-4xl text-white flex items-center justify-center gap-0">
            <span>Fan Manager 2</span>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="inline-block scale-[0.7] -mx-[5px]"
            >
              ⚽
            </motion.span>
            <span>26</span>
          </h1>
          <p className="text-gray-400 mt-3">Premium Football Management Experience</p>
        </div>

        {/* Language Selection Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              type="button"
              onClick={() => onSelectLanguage(lang.code)}
              className="bg-[#1E293B]/80 hover:bg-[#059669]/20 border border-[#059669]/30 text-white flex flex-col items-center justify-center gap-3 h-[100px] rounded-2xl transition-all hover:border-[#059669] hover:shadow-lg hover:shadow-[#059669]/20"
            >
              <span className="text-4xl">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
            </Button>
          ))}
        </div>

        {/* Welcome Message */}
        <p className="text-center text-gray-500 text-sm">Benvenuto</p>
      </motion.div>
    </div>
  );
}