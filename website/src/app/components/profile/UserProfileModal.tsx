import { useState, useEffect } from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useUserAuth, UserProfile } from '@/contexts/UserAuthContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Switch } from '@/app/components/ui/switch';
import {
  User,
  Crown,
  Settings,
  Shield,
  LogOut,
  Edit2,
  Save,
  Trophy,
  Target,
  Star,
  Loader2,
  FileText,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Heart,
  Zap,
  Medal,
  Lock,
  X,
  Globe,
  Flag,
} from 'lucide-react';
import { toast } from 'sonner';
import { LegalDocumentsModal } from '@/app/components/legal/LegalDocumentsModal';
import { ChangePasswordModal } from '@/app/components/auth/ChangePasswordModal';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Available languages
const LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

// Available timezones
const TIMEZONES = [
  { id: 'Europe/Istanbul', name: 'İstanbul (UTC+3)', offset: '+03:00' },
  { id: 'Europe/London', name: 'Londra (UTC+0)', offset: '+00:00' },
  { id: 'Europe/Berlin', name: 'Berlin (UTC+1)', offset: '+01:00' },
  { id: 'Europe/Paris', name: 'Paris (UTC+1)', offset: '+01:00' },
  { id: 'Europe/Madrid', name: 'Madrid (UTC+1)', offset: '+01:00' },
  { id: 'America/New_York', name: 'New York (UTC-5)', offset: '-05:00' },
  { id: 'America/Los_Angeles', name: 'Los Angeles (UTC-8)', offset: '-08:00' },
  { id: 'Asia/Dubai', name: 'Dubai (UTC+4)', offset: '+04:00' },
  { id: 'Asia/Shanghai', name: 'Şangay (UTC+8)', offset: '+08:00' },
  { id: 'Asia/Tokyo', name: 'Tokyo (UTC+9)', offset: '+09:00' },
];

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { t, language, setLanguage } = useLanguage();
  const { user, profile, signOut, updateProfile, deleteAccount, isLoading } = useUserAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'badges'>('profile');
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  
  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedNationalTeam, setSelectedNationalTeam] = useState<string>('');
  const [selectedClubTeams, setSelectedClubTeams] = useState<string[]>([]);
  const [nationalTeamSearch, setNationalTeamSearch] = useState('');
  const [clubTeamSearch, setClubTeamSearch] = useState('');
  const [showNationalTeamDropdown, setShowNationalTeamDropdown] = useState(false);
  const [showClubTeamDropdown, setShowClubTeamDropdown] = useState(false);
  
  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [campaignNotifications, setCampaignNotifications] = useState(true);
  const [pushNotificationPermission, setPushNotificationPermission] = useState<NotificationPermission>('default');
  
  // Language & Timezone state
  const [selectedTimezone, setSelectedTimezone] = useState('Europe/Istanbul');

  // Milli takımlar listesi - Futbol popülaritesine göre sıralı (en popülerler başta)
  const nationalTeams = [
    // En popüler futbol ülkeleri (başta - futbol popülaritesine göre)
    '🇹🇷 Türkiye',
    '🇩🇪 Almanya',
    '🇪🇸 İspanya',
    '🇫🇷 Fransa',
    '🇮🇹 İtalya',
    '🇬🇧 İngiltere',
    '🇧🇷 Brezilya',
    '🇦🇷 Arjantin',
    '🇵🇹 Portekiz',
    '🇳🇱 Hollanda',
    '🇧🇪 Belçika',
    '🇭🇷 Hırvatistan',
    '🇺🇾 Uruguay',
    '🇲🇽 Meksika',
    '🇨🇴 Kolombiya',
    '🇨🇭 İsviçre',
    '🇵🇱 Polonya',
    '🇩🇰 Danimarka',
    '🇸🇪 İsveç',
    '🇳🇴 Norveç',
    '🇷🇺 Rusya',
    '🇨🇿 Çekya',
    '🇦🇹 Avusturya',
    '🇨🇱 Şili',
    '🇵🇪 Peru',
    '🇬🇷 Yunanistan',
    '🇷🇴 Romanya',
    '🇸🇮 Slovenya',
    '🇸🇰 Slovakya',
    '🇭🇺 Macaristan',
    '🇮🇪 İrlanda',
    '🇮🇸 İzlanda',
    '🇫🇮 Finlandiya',
    '🇷🇸 Sırbistan',
    '🇧🇬 Bulgaristan',
    '🇺🇦 Ukrayna',
    '🇨🇦 Kanada',
    '🇺🇸 ABD',
    '🇯🇵 Japonya',
    '🇰🇷 Güney Kore',
    '🇨🇳 Çin',
    '🇦🇺 Avustralya',
    '🇿🇦 Güney Afrika',
    '🇳🇬 Nijerya',
    '🇪🇬 Mısır',
    '🇲🇦 Fas',
    '🇹🇳 Tunus',
    '🇸🇳 Senegal',
    '🇬🇭 Gana',
    '🇨🇮 Fildişi Sahili',
    '🇰🇪 Kenya',
    '🇨🇲 Kamerun',
    '🇩🇿 Cezayir',
    '🇮🇶 Irak',
    '🇮🇷 İran',
    '🇸🇦 Suudi Arabistan',
    '🇦🇪 BAE',
    '🇶🇦 Katar',
    '🇯🇴 Ürdün',
    '🇱🇧 Lübnan',
    '🇸🇾 Suriye',
    '🇵🇸 Filistin',
    '🇮🇱 İsrail',
    '🇹🇭 Tayland',
    '🇻🇳 Vietnam',
    '🇮🇩 Endonezya',
    '🇲🇾 Malezya',
    '🇸🇬 Singapur',
    '🇵🇭 Filipinler',
    '🇲🇲 Myanmar',
    '🇧🇩 Bangladeş',
    '🇵🇰 Pakistan',
    '🇱🇰 Sri Lanka',
    '🇮🇳 Hindistan',
    '🇦🇫 Afganistan',
    '🇰🇿 Kazakistan',
    '🇺🇿 Özbekistan',
    '🇹🇲 Türkmenistan',
    '🇰🇬 Kırgızistan',
    '🇹🇯 Tacikistan',
    '🇦🇲 Ermenistan',
    '🇬🇪 Gürcistan',
    '🇦🇿 Azerbaycan',
    '🇧🇾 Belarus',
    '🇱🇹 Litvanya',
    '🇱🇻 Letonya',
    '🇪🇪 Estonya',
    '🇲🇩 Moldova',
    '🇦🇱 Arnavutluk',
    '🇲🇰 Kuzey Makedonya',
    '🇧🇦 Bosna Hersek',
    '🇲🇪 Karadağ',
    '🇽🇰 Kosova',
    '🇨🇾 Kıbrıs',
    '🇲🇹 Malta',
    '🇱🇺 Lüksemburg',
    '🇦🇩 Andorra',
    '🇸🇲 San Marino',
    '🇱🇮 Lihtenştayn',
    '🇻🇦 Vatikan',
    '🇲🇨 Monaco',
    '🇬🇮 Cebelitarık',
    '🇪🇨 Ekvador',
    '🇵🇾 Paraguay',
    '🇧🇴 Bolivya',
    '🇻🇪 Venezuela',
    '🇬🇾 Guyana',
    '🇸🇷 Surinam',
    '🇬🇹 Guatemala',
    '🇭🇳 Honduras',
    '🇸🇻 El Salvador',
    '🇨🇷 Kosta Rika',
    '🇵🇦 Panama',
    '🇳🇮 Nikaragua',
    '🇧🇿 Belize',
    '🇯🇲 Jamaika',
    '🇭🇹 Haiti',
    '🇨🇺 Küba',
    '🇹🇹 Trinidad ve Tobago',
    '🇧🇧 Barbados',
    '🇬🇩 Grenada',
    '🇩🇲 Dominika',
    '🇱🇨 Saint Lucia',
    '🇻🇨 Saint Vincent ve Grenadinler',
    '🇦🇬 Antigua ve Barbuda',
    '🇰🇳 Saint Kitts ve Nevis',
    '🇩🇴 Dominik Cumhuriyeti',
    '🇵🇷 Porto Riko',
    '🇧🇸 Bahamalar',
    '🇧🇲 Bermuda',
    '🇿🇼 Zimbabve',
    '🇿🇲 Zambiya',
    '🇹🇿 Tanzanya',
    '🇺🇬 Uganda',
    '🇷🇼 Ruanda',
    '🇧🇼 Botsvana',
    '🇳🇦 Namibya',
    '🇱🇸 Lesotho',
    '🇸🇿 Esvatini',
    '🇲🇼 Malavi',
    '🇲🇿 Mozambik',
    '🇦🇴 Angola',
    '🇨🇩 Kongo DC',
    '🇨🇬 Kongo Cumhuriyeti',
    '🇬🇦 Gabon',
    '🇬🇶 Ekvator Ginesi',
    '🇹🇩 Çad',
    '🇸🇩 Sudan',
    '🇪🇷 Eritre',
    '🇪🇹 Etiyopya',
    '🇩🇯 Cibuti',
    '🇸🇴 Somali',
    '🇲🇺 Mauritius',
    '🇸🇨 Seyşeller',
    '🇰🇲 Komorlar',
    '🇲🇻 Maldivler',
    '🇧🇹 Bhutan',
    '🇳🇵 Nepal',
    '🇲🇳 Moğolistan',
    '🇰🇵 Kuzey Kore',
    '🇦🇸 Amerikan Samoası',
    '🇼🇸 Samoa',
    '🇹🇴 Tonga',
    '🇫🇯 Fiji',
    '🇵🇬 Papua Yeni Gine',
    '🇸🇧 Solomon Adaları',
    '🇻🇺 Vanuatu',
    '🇳🇨 Yeni Kaledonya',
    '🇵🇫 Fransız Polinezyası',
    '🇬🇺 Guam',
    '🇵🇼 Palau',
    '🇫🇲 Mikronezya',
    '🇲🇭 Marshall Adaları',
    '🇳🇷 Nauru',
    '🇰🇮 Kiribati',
  '🇹🇻 Tuvalu',
  ];

  // Milli takım renkleri - Ülke bayrak renkleri
  const NATIONAL_TEAM_COLORS: Record<string, string[]> = {
    'Türkiye': ['#E30A17', '#FFFFFF'],
    'Almanya': ['#000000', '#DD0000', '#FFCE00'],
    'İspanya': ['#AA151B', '#F1BF00'],
    'Fransa': ['#002654', '#FFFFFF', '#ED2939'],
    'İtalya': ['#009246', '#FFFFFF', '#CE2B37'],
    'İngiltere': ['#FFFFFF', '#C8102E'],
    'Brezilya': ['#009739', '#FEDD00', '#012169'],
    'Arjantin': ['#74ACDF', '#FFFFFF'],
    'Portekiz': ['#006600', '#FF0000'],
    'Hollanda': ['#AE1C28', '#FFFFFF', '#21468B'],
    'Belçika': ['#000000', '#FAE042', '#ED2939'],
    'Hırvatistan': ['#171796', '#FFFFFF', '#FF0000'],
    'Uruguay': ['#0038A8', '#FFFFFF'],
    'Meksika': ['#006847', '#FFFFFF', '#CE1126'],
    'Kolombiya': ['#FFCD00', '#003087', '#CE1126'],
    'İsviçre': ['#FF0000', '#FFFFFF'],
    'Polonya': ['#FFFFFF', '#DC143C'],
    'Danimarka': ['#C8102E', '#FFFFFF'],
    'İsveç': ['#006AA7', '#FECC00'],
    'Norveç': ['#BA0C2F', '#FFFFFF', '#00205B'],
    'Rusya': ['#FFFFFF', '#0039A6', '#D52B1E'],
    'Çekya': ['#FFFFFF', '#11457E', '#D7141A'],
    'Avusturya': ['#ED2939', '#FFFFFF'],
    'Şili': ['#0039A6', '#FFFFFF', '#D52B1E'],
    'Peru': ['#D91023', '#FFFFFF'],
    'Yunanistan': ['#0D5EAF', '#FFFFFF'],
    'Romanya': ['#002B7F', '#FCD116', '#CE1126'],
    'Slovenya': ['#FFFFFF', '#0057B8', '#FF0000'],
    'Slovakya': ['#FFFFFF', '#0B4EA2', '#EE1C25'],
    'Macaristan': ['#436F4D', '#FFFFFF', '#CD2A3E'],
    'İrlanda': ['#169B62', '#FFFFFF', '#FF883E'],
    'İzlanda': ['#02529C', '#FFFFFF', '#DC1E35'],
    'Finlandiya': ['#FFFFFF', '#003580'],
    'Sırbistan': ['#C6363C', '#FFFFFF', '#0C4076'],
    'Bulgaristan': ['#FFFFFF', '#00966E', '#D62612'],
    'Ukrayna': ['#0057B7', '#FFD700'],
    'Kanada': ['#FF0000', '#FFFFFF'],
    'ABD': ['#B22234', '#FFFFFF', '#3C3B6E'],
    'Japonya': ['#FFFFFF', '#BC002D'],
    'Güney Kore': ['#FFFFFF', '#000000', '#CE1126', '#0047A0'],
    'Çin': ['#DE2910', '#FFDE00'],
    'Avustralya': ['#00008B', '#FFFFFF', '#FF0000'],
    'Güney Afrika': ['#000000', '#FFB612', '#E1392D', '#007A4D', '#002395', '#FFFFFF'],
    'Nijerya': ['#008753', '#FFFFFF'],
    'Mısır': ['#CE1126', '#FFFFFF', '#000000'],
    'Fas': ['#C1272D', '#FFFFFF'],
    'Tunus': ['#E70013', '#FFFFFF'],
    'Senegal': ['#00853F', '#FCD116', '#CE1126'],
    'Gana': ['#006B3F', '#FCD116', '#CE1126', '#000000'],
    'Fildişi Sahili': ['#F77F00', '#FFFFFF', '#009739'],
    'Kenya': ['#000000', '#FFFFFF', '#DE2910', '#006600'],
    'Kamerun': ['#007A5E', '#FCD116', '#CE1126'],
    'Cezayir': ['#FFFFFF', '#006233', '#D21034'],
    'Irak': ['#CE1126', '#FFFFFF', '#000000'],
    'İran': ['#FFFFFF', '#DA0000', '#239F40'],
    'Suudi Arabistan': ['#006C35', '#FFFFFF'],
    'BAE': ['#FF0000', '#FFFFFF', '#000000'],
    'Katar': ['#8B1538', '#FFFFFF'],
    'Ürdün': ['#000000', '#FFFFFF', '#007A3D', '#CE1126'],
    'Lübnan': ['#ED1C24', '#FFFFFF', '#00A651'],
    'Suriye': ['#FFFFFF', '#000000', '#CE1126', '#007A3D'],
    'Filistin': ['#007A3D', '#FFFFFF', '#000000', '#CE1126'],
    'İsrail': ['#FFFFFF', '#0038B8'],
    'Tayland': ['#ED1C24', '#FFFFFF', '#241D4F'],
    'Vietnam': ['#DA251D', '#FFCE00'],
    'Endonezya': ['#FF0000', '#FFFFFF'],
    'Malezya': ['#FFFFFF', '#006644', '#CE1126', '#0000FF', '#FFD700'],
    'Singapur': ['#EF3340', '#FFFFFF'],
    'Filipinler': ['#0038A8', '#FFFFFF', '#CE1126', '#FFD700'],
    'Myanmar': ['#FECB00', '#34B233', '#EA2839'],
    'Bangladeş': ['#006A4E', '#F42A41'],
    'Pakistan': ['#FFFFFF', '#01411C'],
    'Sri Lanka': ['#FFBE29', '#8D1538', '#00534E', '#FFBE29'],
    'Hindistan': ['#FF9933', '#FFFFFF', '#138808'],
    'Afganistan': ['#000000', '#CE1126', '#009639'],
    'Kazakistan': ['#00AFCA', '#FFE700'],
    'Özbekistan': ['#1EB53A', '#FFFFFF', '#0038A8', '#CE1126'],
    'Türkmenistan': ['#27AE60', '#FFFFFF', '#E30A17'],
    'Kırgızistan': ['#FF0000', '#FFD700'],
    'Tacikistan': ['#0C6138', '#FFFFFF', '#DE2910', '#FFCE02'],
    'Ermenistan': ['#D90012', '#0033A0', '#F2A800'],
    'Gürcistan': ['#FFFFFF', '#FF0000'],
    'Azerbaycan': ['#00AFCA', '#E30A17', '#009639'],
    'Belarus': ['#FFD700', '#006B3F', '#DA020E'],
    'Litvanya': ['#FFD700', '#006A44', '#C1272D'],
    'Letonya': ['#9E3039', '#FFFFFF'],
    'Estonya': ['#FFFFFF', '#000080', '#000000'],
    'Moldova': ['#FFCC02', '#0033A0', '#CC0000'],
    'Arnavutluk': ['#E30A17', '#000000'],
    'Kuzey Makedonya': ['#CE2029', '#FFD700'],
    'Bosna Hersek': ['#002395', '#FFFFFF', '#FFCC00', '#009639'],
    'Karadağ': ['#CE2029', '#FFD700'],
    'Kosova': ['#244AA5', '#FFFFFF', '#D21034', '#FFCE02'],
    'Kıbrıs': ['#FFFFFF', '#006600'],
    'Malta': ['#FFFFFF', '#CE1126'],
    'Lüksemburg': ['#00A1DE', '#FFFFFF', '#EF3340'],
    'Andorra': ['#0018A8', '#FFD700', '#C8102E'],
    'San Marino': ['#FFFFFF', '#5CACEE'],
    'Lihtenştayn': ['#002B7F', '#FF0000'],
    'Vatikan': ['#FFE600', '#FFFFFF', '#FF0000'],
    'Monaco': ['#FFFFFF', '#CE1126'],
    'Cebelitarık': ['#FFFFFF', '#CE1126', '#0000FF'],
    'Ekvador': ['#FFD700', '#0033A0', '#CC0000'],
    'Paraguay': ['#0038A8', '#FFFFFF', '#CE1126'],
    'Bolivya': ['#007A33', '#FFD700', '#CE1126'],
    'Venezuela': ['#FFCC02', '#0033A0', '#CC0000'],
    'Guyana': ['#009639', '#FFFFFF', '#FFCC02', '#000000', '#CE1126'],
    'Surinam': ['#377E3F', '#FFFFFF', '#B40A2D', '#FFD700'],
    'Guatemala': ['#4997D0', '#FFFFFF'],
    'Honduras': ['#006847', '#FFFFFF'],
    'El Salvador': ['#006847', '#FFFFFF', '#0000FF'],
    'Kosta Rika': ['#00247D', '#FFFFFF', '#CE1126'],
    'Panama': ['#FFFFFF', '#005293', '#D21034'],
    'Nikaragua': ['#0067CE', '#FFFFFF'],
    'Belize': ['#003F87', '#D21034'],
    'Jamaika': ['#009639', '#FFD700', '#000000'],
    'Haiti': ['#00209F', '#FFFFFF', '#D21034'],
    'Küba': ['#002A8F', '#FFFFFF', '#CE1126'],
    'Trinidad ve Tobago': ['#CE1126', '#FFFFFF', '#000000'],
    'Barbados': ['#00267F', '#FFD700', '#000000'],
    'Grenada': ['#CE1126', '#FFD700', '#006600'],
    'Dominika': ['#009639', '#FFD700', '#000000', '#FFFFFF', '#D21034'],
    'Saint Lucia': ['#6CF', '#FFFFFF', '#000000', '#FFD700'],
    'Saint Vincent ve Grenadinler': ['#009639', '#FFD700', '#000000', '#0066CC'],
    'Antigua ve Barbuda': ['#000000', '#FF0000', '#0066CC', '#FFFFFF', '#FFD700'],
    'Saint Kitts ve Nevis': ['#009639', '#FFD700', '#000000', '#CE1126', '#FFFFFF'],
    'Dominik Cumhuriyeti': ['#00247D', '#FFFFFF', '#CE1126'],
    'Porto Riko': ['#FFFFFF', '#CE1126', '#00247D'],
    'Bahamalar': ['#00ABC9', '#FFD700', '#000000'],
    'Bermuda': ['#EF3340', '#FFFFFF', '#00247D'],
    'Zimbabve': ['#009739', '#FFD700', '#000000', '#CE1126', '#FFFFFF'],
    'Zambiya': ['#009639', '#FF0000', '#000000', '#FFD700'],
    'Tanzanya': ['#1EB53A', '#FFD700', '#000000', '#006600'],
    'Uganda': ['#000000', '#FFD700', '#CE1126', '#FFFFFF'],
    'Ruanda': ['#009639', '#FFD700', '#0000FF', '#CE1126'],
    'Botsvana': ['#75AADB', '#FFFFFF', '#000000'],
    'Namibya': ['#009639', '#FFFFFF', '#0038A8', '#CE1126', '#FFD700'],
    'Lesotho': ['#009639', '#FFFFFF', '#0038A8'],
    'Esvatini': ['#000000', '#FF0000', '#FFD700', '#FFFFFF', '#0038A8'],
    'Malavi': ['#CE1126', '#FFD700', '#000000'],
    'Mozambik': ['#009639', '#FFFFFF', '#000000', '#FFD700', '#CE1126'],
    'Angola': ['#FF0000', '#000000'],
    'Kongo DC': ['#009639', '#FFD700', '#0000FF'],
    'Kongo Cumhuriyeti': ['#009639', '#FFD700', '#CE1126'],
    'Gabon': ['#009639', '#FFD700', '#0038A8'],
    'Ekvator Ginesi': ['#009639', '#FFFFFF', '#CE1126', '#0038A8'],
    'Çad': ['#009639', '#FFD700', '#CE1126'],
    'Sudan': ['#009639', '#FFFFFF', '#000000', '#CE1126'],
    'Eritre': ['#009639', '#FFD700', '#CE1126', '#0038A8'],
    'Etiyopya': ['#009639', '#FFD700', '#CE1126'],
    'Cibuti': ['#009639', '#FFFFFF', '#0038A8', '#CE1126'],
    'Somali': ['#4189DD', '#FFFFFF'],
    'Mauritius': ['#FF0000', '#FFFFFF', '#0038A8', '#009639'],
    'Seyşeller': ['#0038A8', '#FFFFFF', '#009639', '#CE1126', '#FFD700'],
    'Komorlar': ['#009639', '#FFFFFF', '#0038A8', '#CE1126', '#FFD700'],
    'Maldivler': ['#CE1126', '#FFFFFF', '#009639'],
    'Bhutan': ['#FFD700', '#FF0000'],
    'Nepal': ['#CE1126', '#0038A8', '#FFFFFF'],
    'Moğolistan': ['#CE1126', '#0038A8', '#FFD700'],
    'Kuzey Kore': ['#024FA2', '#FFFFFF', '#ED1C24', '#FFD700'],
    'Amerikan Samoası': ['#0038A8', '#FFFFFF', '#CE1126'],
    'Samoa': ['#CE1126', '#0038A8', '#FFFFFF'],
    'Tonga': ['#CE1126', '#FFFFFF'],
    'Fiji': ['#0038A8', '#FFFFFF', '#CE1126'],
    'Papua Yeni Gine': ['#000000', '#FF0000', '#FFD700'],
    'Solomon Adaları': ['#0038A8', '#009639', '#FFFFFF', '#FFD700', '#CE1126'],
    'Vanuatu': ['#009639', '#FFD700', '#CE1126', '#000000'],
    'Yeni Kaledonya': ['#0038A8', '#FFFFFF', '#CE1126'],
    'Fransız Polinezyası': ['#0038A8', '#FFFFFF', '#CE1126'],
    'Guam': ['#0038A8', '#FF0000'],
    'Palau': ['#009639', '#FFD700'],
    'Mikronezya': ['#0038A8', '#FFFFFF'],
    'Marshall Adaları': ['#0038A8', '#FFFFFF', '#FFD700', '#009639'],
    'Nauru': ['#0038A8', '#FFD700'],
    'Kiribati': ['#FF0000', '#FFFFFF', '#0038A8', '#FFD700'],
    'Tuvalu': ['#0038A8', '#FFFFFF', '#FFD700', '#009639', '#CE1126'],
  };

  // Ülke adından renkleri al
  const getNationalTeamColors = (teamString: string): string[] => {
    // Extract country name from emoji string
    const countryName = teamString.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '').replace(/🏴[^\s]*\s*/u, '').trim();
    return NATIONAL_TEAM_COLORS[countryName] || ['#1FA2A6', '#0F2A24'];
  };
  
  // Kulüp takımları listesi
  const clubTeamsList = [
    // Türkiye
    'Fenerbahçe', 'Galatasaray', 'Beşiktaş', 'Trabzonspor', 'Başakşehir',
    // İngiltere
    'Arsenal', 'Manchester City', 'Liverpool', 'Chelsea', 'Manchester United', 'Tottenham',
    // İspanya
    'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Valencia',
    // Almanya
    'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
    // Fransa
    'PSG', 'Lyon', 'Marseille', 'Monaco',
    // İtalya
    'Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'Roma',
  ];

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPushNotificationPermission(Notification.permission);
    }
  }, []);

  // Initialize form data from profile
  useEffect(() => {
    if (profile && user && open) {
      const nameParts = (profile.name || user.user_metadata?.name || user.email?.split('@')[0] || '').split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setNickname(profile.nickname || profile.name || user.email?.split('@')[0] || '');
      
      // Takımları milli takım ve kulüp takımları olarak ayır
      const teams = profile.favoriteTeams || [];
      const nationalTeam = teams.find((team: string) => nationalTeams.includes(team)) || '';
      const clubTeams = teams.filter((team: string) => clubTeamsList.includes(team)) || [];
      setSelectedNationalTeam(nationalTeam);
      setSelectedClubTeams(clubTeams);
      
      // Google/Apple kayıt olanlar için otomatik doldur
      if (user.app_metadata?.provider === 'google' || user.app_metadata?.provider === 'apple') {
        const fullName = user.user_metadata?.name || user.user_metadata?.full_name || '';
        if (fullName) {
          const parts = fullName.split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }
        setNickname(user.user_metadata?.name || user.email?.split('@')[0] || '');
      }

      // Eğer nickname veya milli takım eksikse otomatik düzenleme moduna geç
      const isEmailUser = user.app_metadata?.provider === 'email' || !user.app_metadata?.provider;
      const hasNickname = profile.nickname || profile.name;
      const hasNationalTeam = nationalTeam !== '';
      
      if ((isEmailUser && !hasNickname) || !hasNationalTeam) {
        setIsEditing(true);
      }
    }
  }, [profile, user, open]);

  // User stats (mobile app ile tutarlı)
  // TODO: Bu veriler backend'den gelecek - şimdilik placeholder değerler
  const userStats = {
    level: 1,
    points: 0,
    badgeCount: 0,
    successRate: 0,
    totalPredictions: 0,
    dayStreak: 0,
    countryRank: 0, // Türkiye'deki sıralaması
    globalRank: 0, // Dünyadaki sıralaması
    totalPlayers: 1000, // Toplam oyuncu sayısı
    avgMatchRating: 0,
    xpGainThisWeek: 0,
  };

  // Favorite teams (mobile app ile tutarlı)
  const favoriteTeams = profile?.favoriteTeams || [];

  // Achievements (mobile app ile tutarlı)
  const achievements = [
    { id: 'winner', icon: '🏆', name: 'Winner', description: '10 doğru tahmin' },
    { id: 'streak', icon: '🔥', name: 'Streak Master', description: '5 gün üst üste' },
    { id: 'expert', icon: '⭐', name: 'Expert', description: 'Level 10\'a ulaştı' },
  ];

  // Badges (mobile app ile tutarlı - 25 rozet)
  const allBadges = [
    // Bronz Tier
    { id: 'first_prediction', name: 'İlk Tahmin', icon: '🎯', tier: 'bronze', earned: false, howToEarn: 'İlk tahmininizi yapın' },
    { id: 'rookie', name: 'Çaylak', icon: '🌱', tier: 'bronze', earned: false, howToEarn: '5 tahmin yapın' },
    { id: 'streak_3', name: '3\'lü Seri', icon: '🔥', tier: 'bronze', earned: false, howToEarn: '3 ardışık doğru tahmin' },
    { id: 'early_bird', name: 'Erken Kuş', icon: '🐦', tier: 'bronze', earned: false, howToEarn: 'Maçtan 24 saat önce tahmin yapın' },
    { id: 'daily_player', name: 'Günlük Oyuncu', icon: '📅', tier: 'bronze', earned: false, howToEarn: '7 gün üst üste aktif olun' },
    
    // Gümüş Tier
    { id: 'streak_5', name: '5\'li Seri', icon: '🔥', tier: 'silver', earned: false, howToEarn: '5 ardışık doğru tahmin' },
    { id: 'league_expert', name: 'Lig Uzmanı', icon: '🏟️', tier: 'silver', earned: false, howToEarn: 'Tek bir ligde 20 doğru tahmin' },
    { id: 'team_supporter', name: 'Takım Destekçisi', icon: '🎽', tier: 'silver', earned: false, howToEarn: 'Favori takımınızın 10 maçını tahmin edin' },
    { id: 'quick_learner', name: 'Hızlı Öğrenen', icon: '📚', tier: 'silver', earned: false, howToEarn: 'İlk haftada 50 puan kazanın' },
    { id: 'night_owl', name: 'Gece Kuşu', icon: '🦉', tier: 'silver', earned: false, howToEarn: 'Gece 00:00 sonrası 10 tahmin yapın' },
    
    // Altın Tier
    { id: 'streak_10', name: '10\'lu Seri', icon: '🔥', tier: 'gold', earned: false, howToEarn: '10 ardışık doğru tahmin' },
    { id: 'perfect_week', name: 'Mükemmel Hafta', icon: '⭐', tier: 'gold', earned: false, howToEarn: 'Bir haftada %100 başarı' },
    { id: 'multi_league', name: 'Çoklu Lig Ustası', icon: '🌍', tier: 'gold', earned: false, howToEarn: '5 farklı ligde tahmin yapın' },
    { id: 'prediction_wizard', name: 'Tahmin Büyücüsü', icon: '🧙', tier: 'gold', earned: false, howToEarn: '%75+ başarı oranı (min 50 tahmin)' },
    { id: 'consistency_champ', name: 'Tutarlılık Şampiyonu', icon: '📊', tier: 'gold', earned: false, howToEarn: '30 gün üst üste aktif olun' },
    
    // Platin Tier
    { id: 'streak_20', name: '20\'li Seri', icon: '🔥', tier: 'platinum', earned: false, howToEarn: '20 ardışık doğru tahmin' },
    { id: 'champion', name: 'Şampiyon', icon: '🏆', tier: 'platinum', earned: false, howToEarn: 'Haftalık liderlik tablosunda 1. olun' },
    { id: 'legend', name: 'Efsane', icon: '👑', tier: 'platinum', earned: false, howToEarn: '1000 doğru tahmin yapın' },
    { id: 'legendary_analyst', name: 'Efsanevi Analist', icon: '🔮', tier: 'platinum', earned: false, howToEarn: '%85+ başarı oranı (min 100 tahmin)' },
    { id: 'pro_predictor', name: 'Pro Tahmincu', icon: '💎', tier: 'platinum', earned: false, howToEarn: 'Pro üye olun ve 100 tahmin yapın' },
    
    // Elmas Tier
    { id: 'streak_50', name: '50\'li Seri', icon: '🔥', tier: 'diamond', earned: false, howToEarn: '50 ardışık doğru tahmin' },
    { id: 'tacticiq_master', name: 'TacticIQ Master', icon: '🎓', tier: 'diamond', earned: false, howToEarn: 'Diğer 24 rozeti kazanın' },
    { id: 'world_champion', name: 'Dünya Şampiyonu', icon: '🌟', tier: 'diamond', earned: false, howToEarn: 'Global liderlik tablosunda 1. olun' },
    { id: 'perfect_month', name: 'Mükemmel Ay', icon: '🌙', tier: 'diamond', earned: false, howToEarn: 'Bir ayda %90+ başarı oranı' },
    { id: 'ultimate_fan', name: 'Ultimate Fan', icon: '⚽', tier: 'diamond', earned: false, howToEarn: '5000 puan kazanın' },
  ];

  // Show loading state while auth is initializing
  if (isLoading || !user || !profile) {
    return null;
  }

  const handleSaveProfile = async () => {
    // Email ile kayıt olanlar için nickname zorunlu
    const isEmailUser = user.app_metadata?.provider === 'email' || !user.app_metadata?.provider;
    if (isEmailUser && !nickname.trim()) {
      toast.error('Nickname zorunludur');
      return;
    }

    // Milli takım seçimi zorunlu (her kullanıcı için)
    if (!selectedNationalTeam) {
      toast.error('Lütfen bir milli takım seçin');
      return;
    }

    // Pro kullanıcılar için kulüp takım limiti kontrolü
    if (isPro && selectedClubTeams.length > 5) {
      toast.error('Maksimum 5 kulüp takımı seçebilirsiniz');
      return;
    }

    // Free kullanıcılar kulüp takımı seçemez
    if (!isPro && selectedClubTeams.length > 0) {
      toast.error('Kulüp takımı seçmek için Pro üye olmanız gerekiyor');
      return;
    }

    setSaving(true);
    try {
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || nickname;
      // Milli takım + kulüp takımları birleştir
      const allTeams = [selectedNationalTeam, ...selectedClubTeams].filter(Boolean);
      const result = await updateProfile({ 
        name: fullName || nickname,
        nickname: nickname,
        favoriteTeams: allTeams,
      });
      if (result.success) {
        toast.success('Profil güncellendi');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Profil güncellenemedi');
      }
    } catch (err) {
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Çıkış yapıldı');
    onOpenChange(false);
  };

  const handleDeleteAccount = async () => {
    const confirmText = deleteConfirmText.toLowerCase().trim();
    if (confirmText !== 'sil' && confirmText !== 'delete') {
      toast.error('Onay için "sil" veya "delete" yazmanız gerekiyor');
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        toast.success('Hesabınız başarıyla silindi');
        setShowDeleteDialog(false);
        setDeleteConfirmText('');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Hesap silme başarısız');
      }
    } catch (err) {
      toast.error('Bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isPro = profile.plan === 'pro';
  const isEmailUser = user.app_metadata?.provider === 'email' || !user.app_metadata?.provider;
  const isGoogleUser = user.app_metadata?.provider === 'google';
  const isAppleUser = user.app_metadata?.provider === 'apple';

  // Takımları otomatik kaydet
  const handleSaveTeams = async (nationalTeam: string, clubTeams: string[]) => {
    try {
      const allTeams = [nationalTeam, ...clubTeams].filter(Boolean);
      const result = await updateProfile({ 
        favoriteTeams: allTeams,
      });
      if (result.success) {
        toast.success('Takımlar güncellendi');
      } else {
        toast.error(result.error || 'Takımlar güncellenemedi');
      }
    } catch (err) {
      console.error('Error saving teams:', err);
    }
  };

  // Kulüp takımı ekleme/kaldırma
  const handleToggleClubTeam = async (team: string) => {
    let newClubTeams: string[];
    
    if (selectedClubTeams.includes(team)) {
      newClubTeams = selectedClubTeams.filter(t => t !== team);
    } else {
      if (isPro && selectedClubTeams.length < 5) {
        newClubTeams = [...selectedClubTeams, team];
      } else if (!isPro) {
        toast.error('Kulüp takımı seçmek için Pro üye olmanız gerekiyor');
        return;
      } else {
        toast.error('Maksimum 5 kulüp takımı seçebilirsiniz');
        return;
      }
    }
    
    setSelectedClubTeams(newClubTeams);
    // Otomatik kaydet
    await handleSaveTeams(selectedNationalTeam, newClubTeams);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('profile.title') || 'Profil'}</SheetTitle>
            <SheetDescription>
              {t('profile.description') || 'Profil bilgilerinizi yönetin'}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 pr-4" style={{ height: 'calc(100vh - 100px)' }}>
            <div className="space-y-6 mt-6">
              {/* Tab Navigation */}
              <div className="flex bg-muted rounded-lg p-1 gap-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'profile' 
                      ? 'bg-background shadow-sm text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <User className="size-4" />
                  Profil
                </button>
                <button
                  onClick={() => setActiveTab('badges')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'badges' 
                      ? 'bg-background shadow-sm text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Trophy className="size-4" />
                  Rozetler
                  {userStats.badgeCount > 0 && (
                    <span className="bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {userStats.badgeCount}
                    </span>
                  )}
                </button>
              </div>

              {activeTab === 'profile' ? (
                <>
                  {/* Profile Header */}
                  <Card>
                    <div className="h-20 bg-gradient-to-r from-secondary/20 via-accent/10 to-secondary/20" />
                    <CardContent className="relative pt-0 pb-4">
                      <div className="flex flex-col items-center -mt-12">
                        <Avatar className="size-20 border-4 border-background shadow-lg mb-3">
                          <AvatarImage src={profile.avatar} />
                          <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-secondary to-accent text-white">
                            {getInitials(profile.name || profile.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-xl font-bold">{profile.name || nickname || profile.email}</h2>
                          {isPro ? (
                            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black">
                              <Crown className="size-3 mr-1" />
                              PRO
                            </Badge>
                          ) : (
                            <Badge variant="outline">Free</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">{profile.email}</p>
                        
                        {/* Ranking Table - Professional Design */}
                        <div className="w-full border rounded-lg overflow-hidden bg-card/50">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-b bg-muted/30">
                                <TableHead className="h-12 text-center font-semibold">
                                  <div className="flex items-center justify-center gap-2">
                                    <Flag className="size-4 text-muted-foreground" />
                                    <span>Ülke</span>
                                  </div>
                                </TableHead>
                                <TableHead className="h-12 text-center font-semibold">
                                  <div className="flex items-center justify-center gap-2">
                                    <Trophy className="size-4 text-secondary" />
                                    <span>Türkiye Sırası</span>
                                  </div>
                                </TableHead>
                                <TableHead className="h-12 text-center font-semibold">
                                  <div className="flex items-center justify-center gap-2">
                                    <Globe className="size-4 text-primary" />
                                    <span>Dünya Sırası</span>
                                  </div>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow className="hover:bg-muted/20 transition-colors">
                                <TableCell className="text-center py-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-xl">🇹🇷</span>
                                    <span className="font-semibold text-sm">TR Türkiye</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                  {userStats.countryRank > 0 ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="text-lg font-bold text-secondary">
                                        #{userStats.countryRank.toLocaleString()}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground font-medium">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center py-4">
                                  {userStats.globalRank > 0 ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="text-lg font-bold text-primary">
                                        #{userStats.globalRank.toLocaleString()}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground font-medium">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Achievements Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Star className="size-4 text-amber-500" />
                        Başarımlar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        {achievements.map((achievement) => (
                          <Card 
                            key={achievement.id} 
                            className="text-center p-4 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                          >
                            <span className="text-4xl block mb-2">{achievement.icon}</span>
                            <p className="text-sm font-semibold mb-1">{achievement.name}</p>
                            <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profile Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Kişisel Bilgiler</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* First Name */}
                      <div className="space-y-2">
                        <Label>İsim</Label>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="İsim"
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-muted cursor-not-allowed' : ''}
                        />
                      </div>

                      {/* Last Name */}
                      <div className="space-y-2">
                        <Label>Soyisim</Label>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Soyisim"
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-muted cursor-not-allowed' : ''}
                        />
                      </div>

                      {/* Nickname - Zorunlu (email kullanıcılar için) */}
                      <div className="space-y-2">
                        <Label>
                          Nickname {isEmailUser && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="Kullanıcı adı"
                          required={isEmailUser}
                          disabled={!isEditing}
                          className={`${!isEditing ? 'bg-muted cursor-not-allowed' : ''} ${!nickname && isEmailUser && isEditing ? 'border-destructive' : ''}`}
                        />
                        {isEmailUser && (
                          <p className="text-xs text-muted-foreground">Email ile kayıt olanlar için zorunludur</p>
                        )}
                      </div>

                      {/* Milli Takım Seçimi - Zorunlu (Tüm kullanıcılar için) - Searchable Button */}
                      <div className="space-y-2">
                        <Label>
                          Milli Takım <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              // Eğer düzenleme modunda değilse, önce düzenleme modunu aç
                              if (!isEditing) {
                                setIsEditing(true);
                              }
                              // Dropdown'ı aç/kapat
                              const input = document.getElementById('national-team-search');
                              if (input) {
                                (input as HTMLInputElement).focus();
                              } else {
                                setShowNationalTeamDropdown(!showNationalTeamDropdown);
                              }
                            }}
                            className={`w-full flex items-center justify-between h-10 px-3 py-2 text-sm border rounded-md bg-background cursor-pointer hover:bg-accent ${!selectedNationalTeam ? 'border-destructive' : 'border-input'}`}
                          >
                            <span className={selectedNationalTeam ? '' : 'text-muted-foreground'}>
                              {selectedNationalTeam || 'Milli takım seçin veya ara...'}
                            </span>
                            <div className="flex items-center gap-2">
                              {selectedNationalTeam && !nationalTeamSearch && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedNationalTeam('');
                                    setNationalTeamSearch('');
                                  }}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="size-4" />
                                </button>
                              )}
                              <svg
                                className="size-4 opacity-50"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>
                          
                          {/* Search Input - Hidden by default, shown when clicked */}
                          {(showNationalTeamDropdown || nationalTeamSearch) && isEditing && (
                            <div 
                              className="absolute z-30 w-full mt-1 bg-popover border rounded-lg shadow-lg"
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <div className="p-2 border-b">
                                <Input
                                  id="national-team-search"
                                  placeholder="Ara... (min 3 karakter)"
                                  value={nationalTeamSearch}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setNationalTeamSearch(value);
                                    if (value.length >= 3) {
                                      setShowNationalTeamDropdown(true);
                                    }
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      if (!document.activeElement?.closest('.absolute.z-30')) {
                                        setShowNationalTeamDropdown(false);
                                        setNationalTeamSearch('');
                                      }
                                    }, 200);
                                  }}
                                  autoFocus
                                  className="w-full"
                                />
                              </div>
                              <div className="max-h-60 overflow-y-auto">
                                {(nationalTeamSearch.length >= 3 ? nationalTeams.filter(team => 
                                  team.toLowerCase().includes(nationalTeamSearch.toLowerCase())
                                ) : nationalTeams).map(team => (
                                  <button
                                    key={team}
                                    onClick={async () => {
                                      setSelectedNationalTeam(team);
                                      setNationalTeamSearch('');
                                      setShowNationalTeamDropdown(false);
                                      // Otomatik kaydet
                                      await handleSaveTeams(team, selectedClubTeams);
                                    }}
                                    className={`w-full p-2 hover:bg-muted text-left text-sm transition-colors flex items-center justify-between ${
                                      selectedNationalTeam === team ? 'bg-primary/10' : ''
                                    }`}
                                  >
                                    <span>{team.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '').trim()}</span>
                                    {team.match(/^[\u{1F1E6}-\u{1F1FF}]{2}/u) && (
                                      <span className="text-lg ml-2">{team.match(/^[\u{1F1E6}-\u{1F1FF}]{2}/u)?.[0]}</span>
                                    )}
                                  </button>
                                ))}
                                {nationalTeamSearch.length >= 3 && nationalTeams.filter(team => 
                                  team.toLowerCase().includes(nationalTeamSearch.toLowerCase())
                                ).length === 0 && (
                                  <div className="p-2 text-sm text-muted-foreground text-center">
                                    Sonuç bulunamadı
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Bir milli takım seçmeniz zorunludur</p>
                      </div>

                      {/* Kulüp Takımları Seçimi - Sadece Pro kullanıcılar için - Searchable Button */}
                      {isPro && (
                        <div className="space-y-2">
                          <Label>
                            Kulüp Takımları <span className="text-xs text-muted-foreground">(Maksimum 5)</span>
                          </Label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('club-team-search');
                                if (input) {
                                  (input as HTMLInputElement).focus();
                                } else {
                                  setShowClubTeamDropdown(!showClubTeamDropdown);
                                }
                              }}
                              disabled={selectedClubTeams.length >= 5}
                              className={`w-full flex items-center justify-between h-10 px-3 py-2 text-sm border rounded-md bg-background ${
                                selectedClubTeams.length >= 5
                                  ? 'bg-muted cursor-not-allowed opacity-50'
                                  : 'cursor-pointer hover:bg-accent'
                              } border-input`}
                            >
                              <span className="text-muted-foreground">
                                {selectedClubTeams.length > 0 
                                  ? `${selectedClubTeams.length} takım seçildi`
                                  : 'Kulüp takımı seçin veya ara...'}
                              </span>
                              <svg
                                className="size-4 opacity-50"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            
                            {/* Search Input - Hidden by default, shown when clicked */}
                            {(showClubTeamDropdown || clubTeamSearch) && (
                              <div 
                                className="absolute z-30 w-full mt-1 bg-popover border rounded-lg shadow-lg"
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                <div className="p-2 border-b">
                                  <Input
                                    id="club-team-search"
                                    placeholder="Ara... (min 3 karakter)"
                                    value={clubTeamSearch}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setClubTeamSearch(value);
                                      if (value.length >= 3) {
                                        setShowClubTeamDropdown(true);
                                      }
                                    }}
                                    onBlur={() => {
                                      setTimeout(() => {
                                        if (!document.activeElement?.closest('.absolute.z-30')) {
                                          setShowClubTeamDropdown(false);
                                          setClubTeamSearch('');
                                        }
                                      }, 200);
                                    }}
                                    autoFocus
                                    className="w-full"
                                  />
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  {(clubTeamSearch.length >= 3 ? clubTeamsList.filter(team => 
                                    team.toLowerCase().includes(clubTeamSearch.toLowerCase()) &&
                                    !selectedClubTeams.includes(team)
                                  ) : clubTeamsList.filter(team => !selectedClubTeams.includes(team))).map(team => (
                                    <button
                                      key={team}
                                      onClick={async () => {
                                        await handleToggleClubTeam(team);
                                        setClubTeamSearch('');
                                        setShowClubTeamDropdown(false);
                                      }}
                                      disabled={selectedClubTeams.length >= 5}
                                      className={`w-full p-2 hover:bg-muted text-left text-sm transition-colors ${
                                        selectedClubTeams.includes(team) ? 'bg-primary/10' : ''
                                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                      {team}
                                      {selectedClubTeams.includes(team) && (
                                        <span className="ml-2 text-primary">✓</span>
                                      )}
                                    </button>
                                  ))}
                                  {clubTeamSearch.length >= 3 && clubTeamsList.filter(team => 
                                    team.toLowerCase().includes(clubTeamSearch.toLowerCase()) &&
                                    !selectedClubTeams.includes(team)
                                  ).length === 0 && (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                      {selectedClubTeams.length >= 5 ? 'Maksimum 5 kulüp takımı seçebilirsiniz' : 'Sonuç bulunamadı'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Selected Teams */}
                          {selectedClubTeams.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {selectedClubTeams.map(team => (
                                <Badge key={team} variant="secondary" className="gap-1">
                                  {team}
                                  <button
                                    onClick={async () => await handleToggleClubTeam(team)}
                                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                                  >
                                    <X className="size-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {selectedClubTeams.length} / 5 kulüp takımı seçildi
                          </p>
                        </div>
                      )}

                      {/* Kulüp Takımları - Free kullanıcılar için kilitli */}
                      {!isPro && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            Kulüp Takımları
                            <Lock className="size-3 text-muted-foreground" />
                            <span className="text-xs text-amber-500">(Pro)</span>
                          </Label>
                          <div className="border border-muted rounded-lg p-4 bg-muted/30 relative">
                            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                              <div className="text-center">
                                <Lock className="size-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm font-medium text-muted-foreground">Pro Üye Gerekli</p>
                                <p className="text-xs text-muted-foreground mt-1">5 kulüp takımı seçmek için Pro üye olun</p>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="mt-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-600 hover:to-yellow-500"
                                  onClick={() => {
                                    onOpenChange(false);
                                    setTimeout(() => {
                                      const pricingSection = document.getElementById('pricing');
                                      if (pricingSection) {
                                        pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      } else {
                                        window.location.hash = '#pricing';
                                      }
                                    }, 300);
                                  }}
                                >
                                  <Crown className="size-4 mr-1" />
                                  Pro Üye Ol
                                </Button>
                              </div>
                            </div>
                            {/* Kulüp Takımları Arama Combobox */}
                            <div className="relative">
                              <button
                                type="button"
                                disabled={true}
                                className="w-full flex items-center justify-between h-10 px-3 py-2 text-sm border rounded-md bg-background/50 opacity-50 cursor-not-allowed border-input"
                              >
                                <span className="text-muted-foreground">
                                  Pro üye olarak kulüp takımı seçebilirsiniz
                                </span>
                                <Lock className="size-4 opacity-50" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2 opacity-40">
                              {clubTeamsList.slice(0, 6).map(team => (
                                <div key={team} className="flex items-center gap-2 p-2 rounded-md bg-background">
                                  <div className="size-4 rounded border-2 border-muted-foreground" />
                                  <span className="text-xs">{team}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Save Button */}
                      {isEditing && (
                        <div className="flex gap-2 pt-2">
                          <Button onClick={handleSaveProfile} disabled={saving} className="flex-1">
                            {saving ? (
                              <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Kaydediliyor...
                              </>
                            ) : (
                              <>
                                <Save className="size-4 mr-2" />
                                Kaydet
                              </>
                            )}
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            İptal
                          </Button>
                        </div>
                      )}
                      
                      {!isEditing && (
                        <div className="pt-2">
                          <Button onClick={() => setIsEditing(true)} className="w-full" variant="outline">
                            <Edit2 className="size-4 mr-2" />
                            Düzenle
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Ayarlar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Language & Timezone */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Dil</Label>
                          <Select 
                            value={language} 
                            onValueChange={(value: Language) => {
                              setLanguage(value);
                              toast.success(`Dil değiştirildi: ${LANGUAGES.find(l => l.code === value)?.name}`);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGES.map(lang => (
                                <SelectItem key={lang.code} value={lang.code}>
                                  <span className="flex items-center gap-2">
                                    <span>{lang.flag}</span>
                                    <span>{lang.name}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Saat Dilimi</Label>
                          <Select 
                            value={selectedTimezone} 
                            onValueChange={(value) => {
                              setSelectedTimezone(value);
                              toast.success(`Saat dilimi değiştirildi`);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIMEZONES.map(tz => (
                                <SelectItem key={tz.id} value={tz.id}>
                                  {tz.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      {/* Mobile Notification Settings */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm text-muted-foreground">Mobil Bildirimler</h4>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>E-posta Bildirimleri</Label>
                            <p className="text-xs text-muted-foreground">Maç sonuçları ve tahmin hatırlatmaları</p>
                          </div>
                          <Switch 
                            checked={emailNotifications}
                            onCheckedChange={(checked) => {
                              setEmailNotifications(checked);
                              toast.success(checked ? 'E-posta bildirimleri açıldı' : 'E-posta bildirimleri kapatıldı');
                            }}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Haftalık Özet</Label>
                            <p className="text-xs text-muted-foreground">Haftalık performans özeti</p>
                          </div>
                          <Switch 
                            checked={weeklySummary}
                            onCheckedChange={(checked) => {
                              setWeeklySummary(checked);
                              toast.success(checked ? 'Haftalık özet açıldı' : 'Haftalık özet kapatıldı');
                            }}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Kampanya Bildirimleri</Label>
                            <p className="text-xs text-muted-foreground">İndirim ve özel teklifler</p>
                          </div>
                          <Switch 
                            checked={campaignNotifications}
                            onCheckedChange={(checked) => {
                              setCampaignNotifications(checked);
                              toast.success(checked ? 'Kampanya bildirimleri açıldı' : 'Kampanya bildirimleri kapatıldı');
                            }}
                          />
                        </div>
                        
                        {/* Push Notification Permission */}
                        {typeof window !== 'undefined' && 'Notification' in window && (
                          <>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>Canlı Bildirimler</Label>
                                <p className="text-xs text-muted-foreground">
                                  Tarayıcı bildirim izni - Maç sonuçları ve canlı güncellemeler
                                </p>
                              </div>
                              {pushNotificationPermission === 'granted' ? (
                                <Badge variant="default" className="bg-green-500 text-white border-green-600">
                                  ✓ Aktif
                                </Badge>
                              ) : pushNotificationPermission === 'denied' ? (
                                <Badge variant="destructive">
                                  X Reddedildi
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      if ('Notification' in window) {
                                        const permission = await Notification.requestPermission();
                                        setPushNotificationPermission(permission);
                                        
                                        if (permission === 'granted') {
                                          toast.success('Canlı bildirim izni verildi!');
                                          // Test notification gönder
                                          new Notification('TacticIQ', {
                                            body: 'Canlı bildirimler aktif! Maç sonuçları ve önemli güncellemeler için bildirim alacaksınız.',
                                            icon: '/favicon.ico',
                                          });
                                        } else if (permission === 'denied') {
                                          toast.error('Bildirim izni reddedildi. Tarayıcı ayarlarından değiştirebilirsiniz.');
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Notification permission error:', error);
                                      toast.error('Bildirim izni alınamadı. Lütfen tarayıcı ayarlarını kontrol edin.');
                                    }
                                  }}
                                >
                                  <Zap className="size-4 mr-1" />
                                  İzin Ver
                                </Button>
                              )}
                            </div>
                            {pushNotificationPermission === 'denied' && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Bildirim izni tarayıcı ayarlarından açılabilir. Ayarlar → Site İzinleri → Bildirimler
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <Separator />

                      {/* Legal Documents */}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setShowLegalModal(true)}
                      >
                        <FileText className="size-4 mr-2" />
                        Yasal Bilgilendirmeler
                      </Button>

                      <Separator />

                      {/* Security & Account Section */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                          <Shield className="size-4" />
                          Güvenlik ve Hesap
                        </h4>
                        
                        {/* Password Change - Email users only */}
                        {isEmailUser && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setShowChangePasswordModal(true)}
                          >
                            <Lock className="size-4 mr-2" />
                            Şifre Değiştir
                          </Button>
                        )}
                        
                        {/* Sign Out */}
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={handleSignOut}
                        >
                          <LogOut className="size-4 mr-2" />
                          Çıkış Yap
                        </Button>

                        {/* Delete Account - Hidden in collapsible */}
                        <div className="border border-destructive/20 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setShowDeleteSection(!showDeleteSection)}
                            className="w-full p-3 text-left text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Trash2 className="size-4" />
                              <span className="text-sm font-medium">Hesabı Sil</span>
                            </div>
                            <AlertTriangle className={`size-4 opacity-50 transition-transform ${showDeleteSection ? 'rotate-180' : ''}`} />
                          </button>
                          {showDeleteSection && (
                            <div className="p-4 bg-destructive/5 border-t border-destructive/20 space-y-3 animate-in slide-in-from-top-2">
                              <Alert variant="destructive">
                                <AlertTriangle className="size-4" />
                                <AlertDescription className="text-xs">
                                  Hesabınızı silmek kalıcıdır ve geri alınamaz. Tüm verileriniz silinecektir.
                                </AlertDescription>
                              </Alert>
                              <Button 
                                variant="destructive" 
                                className="w-full"
                                onClick={() => {
                                  setShowDeleteSection(false);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="size-4 mr-2" />
                                Hesabı Kalıcı Olarak Sil
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  {/* Badges Tab */}
                  <Card>
                    <CardContent className="pt-6">
                      {/* Badge Progress */}
                      <Card className="mb-4 bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {allBadges.filter(b => b.earned).length} / {allBadges.length}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((allBadges.filter(b => b.earned).length / allBadges.length) * 100)}%
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
                              style={{ width: `${(allBadges.filter(b => b.earned).length / allBadges.length) * 100}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Badges Grid - 1 satıra 5 rozet */}
                      <div className="grid grid-cols-5 gap-2">
                        {allBadges.map((badge) => (
                          <Card 
                            key={badge.id} 
                            className={`text-center p-3 cursor-pointer transition-all hover:scale-105 group relative ${
                              badge.earned 
                                ? 'border-amber-500/50 bg-amber-500/5' 
                                : 'border-border/50 bg-card'
                            }`}
                            title={badge.earned 
                              ? `${badge.name} - Kazanıldı!` 
                              : `${badge.name} - Nasıl Kazanılır: ${badge.howToEarn}`
                            }
                          >
                            <div className="relative flex items-center justify-center">
                              {!badge.earned && (
                                <div className="absolute -top-2 -right-2 size-6 rounded-full bg-muted border-2 border-background flex items-center justify-center z-10 shadow-md">
                                  <Lock className="size-3.5 text-muted-foreground" />
                                </div>
                              )}
                              {badge.earned && (
                                <div className="absolute -top-2 -right-2 size-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center z-10 shadow-md">
                                  <span className="text-white text-xs font-bold">✓</span>
                                </div>
                              )}
                              <span className="text-5xl block">{badge.icon}</span>
                            </div>
                            <p className="text-xs font-medium mt-2 line-clamp-2">{badge.name}</p>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] mt-2 px-1.5 py-0.5 ${
                                badge.tier === 'bronze' ? 'text-orange-600 border-orange-600/30' :
                                badge.tier === 'silver' ? 'text-slate-400 border-slate-400/30' :
                                badge.tier === 'gold' ? 'text-amber-500 border-amber-500/30' :
                                badge.tier === 'platinum' ? 'text-purple-500 border-purple-500/30' :
                                'text-cyan-400 border-cyan-400/30'
                              }`}
                            >
                              {badge.tier === 'bronze' ? 'Bronz' :
                               badge.tier === 'silver' ? 'Gümüş' :
                               badge.tier === 'gold' ? 'Altın' :
                               badge.tier === 'platinum' ? 'Platin' : 'Elmas'}
                            </Badge>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Legal Documents Modal */}
      <LegalDocumentsModal 
        open={showLegalModal} 
        onOpenChange={setShowLegalModal} 
      />

      {/* Change Password Modal */}
      <ChangePasswordModal 
        open={showChangePasswordModal} 
        onOpenChange={setShowChangePasswordModal} 
      />

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Hesabı Sil
            </DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertDescription>
                Hesabınızı silmek için aşağıya "sil" veya "delete" yazın.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>Onay Metni</Label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="sil veya delete yazın"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              İptal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="size-4 mr-2" />
                  Hesabı Sil
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}