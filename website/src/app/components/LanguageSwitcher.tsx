import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', flagUrl: 'https://flagcdn.com/w20/gb.png' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', flagUrl: 'https://flagcdn.com/w20/de.png' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', flagUrl: 'https://flagcdn.com/w20/fr.png' },
  { code: 'es', name: 'Español', flag: '🇪🇸', flagUrl: 'https://flagcdn.com/w20/es.png' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', flagUrl: 'https://flagcdn.com/w20/it.png' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', flagUrl: 'https://flagcdn.com/w20/tr.png' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', flagUrl: 'https://flagcdn.com/w20/sa.png' },
  { code: 'zh', name: '中文', flag: '🇨🇳', flagUrl: 'https://flagcdn.com/w20/cn.png' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', flagUrl: 'https://flagcdn.com/w20/ru.png' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', flagUrl: 'https://flagcdn.com/w20/in.png' },
];

export function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useLanguage();
  const currentLang = languages.find(l => l.code === currentLanguage) || languages[5];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="size-4" />
          <span className="hidden sm:inline">{currentLang.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`${currentLanguage === lang.code ? 'bg-secondary/10' : ''} flex items-center gap-2`}
            style={{ direction: 'ltr' }} // Arapça için de sola hizalama
          >
            <img 
              src={lang.flagUrl} 
              alt={lang.name}
              className="w-5 h-4 object-cover rounded-sm"
              loading="lazy"
            />
            <span className="flex-1 text-left">{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}