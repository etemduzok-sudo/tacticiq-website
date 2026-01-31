import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  FlatList,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import {
  WEBSITE_BRAND_COLORS,
  WEBSITE_DARK_COLORS,
  WEBSITE_BORDER_RADIUS,
  WEBSITE_SPACING,
  WEBSITE_ICON_SIZES,
  WEBSITE_TYPOGRAPHY,
} from '../config/WebsiteDesignSystem';
import { teamsApi } from '../services/api';
import { STORAGE_KEYS } from '../config/constants';
import { logger } from '../utils/logger';

interface ProfileSetupScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

type SetupStep = 'profile' | 'national-team' | 'club-teams'; // İsim, soyisim, nickname ve avatar tek adımda

interface Team {
  id: number;
  name: string;
  league: string;
  country: string;
  colors: string[];
  type: 'club' | 'national';
  coach?: string;
  apiId?: number;
}

// Milli takımlar listesi - Web'deki ile aynı sırada
const NATIONAL_TEAMS = [
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
  'Türkiye': ['#E30A17', '#FFFFFF'], // Kırmızı-Beyaz
  'Almanya': ['#000000', '#DD0000', '#FFCE00'], // Siyah-Kırmızı-Sarı
  'İspanya': ['#AA151B', '#F1BF00'], // Kırmızı-Sarı
  'Fransa': ['#002654', '#FFFFFF', '#ED2939'], // Mavi-Beyaz-Kırmızı
  'İtalya': ['#009246', '#FFFFFF', '#CE2B37'], // Yeşil-Beyaz-Kırmızı
  'İngiltere': ['#FFFFFF', '#C8102E'], // Beyaz-Kırmızı
  'Brezilya': ['#009739', '#FEDD00', '#012169'], // Yeşil-Sarı-Mavi
  'Arjantin': ['#74ACDF', '#FFFFFF'], // Mavi-Beyaz
  'Portekiz': ['#006600', '#FF0000'], // Yeşil-Kırmızı
  'Hollanda': ['#AE1C28', '#FFFFFF', '#21468B'], // Kırmızı-Beyaz-Mavi
  'Belçika': ['#000000', '#FAE042', '#ED2939'], // Siyah-Sarı-Kırmızı
  'Hırvatistan': ['#171796', '#FFFFFF', '#FF0000'], // Mavi-Beyaz-Kırmızı
  'Uruguay': ['#0038A8', '#FFFFFF'], // Mavi-Beyaz
  'Meksika': ['#006847', '#FFFFFF', '#CE1126'], // Yeşil-Beyaz-Kırmızı
  'Kolombiya': ['#FFCD00', '#003087', '#CE1126'], // Sarı-Mavi-Kırmızı
  'İsviçre': ['#FF0000', '#FFFFFF'], // Kırmızı-Beyaz
  'Polonya': ['#FFFFFF', '#DC143C'], // Beyaz-Kırmızı
  'Danimarka': ['#C8102E', '#FFFFFF'], // Kırmızı-Beyaz
  'İsveç': ['#006AA7', '#FECC00'], // Mavi-Sarı
  'Norveç': ['#BA0C2F', '#FFFFFF', '#00205B'], // Kırmızı-Beyaz-Mavi
  'Rusya': ['#FFFFFF', '#0039A6', '#D52B1E'], // Beyaz-Mavi-Kırmızı
  'Çekya': ['#FFFFFF', '#11457E', '#D7141A'], // Beyaz-Mavi-Kırmızı
  'Avusturya': ['#ED2939', '#FFFFFF'], // Kırmızı-Beyaz
  'Şili': ['#0039A6', '#FFFFFF', '#D52B1E'], // Mavi-Beyaz-Kırmızı
  'Peru': ['#D91023', '#FFFFFF'], // Kırmızı-Beyaz
  'Yunanistan': ['#0D5EAF', '#FFFFFF'], // Mavi-Beyaz
  'Romanya': ['#002B7F', '#FCD116', '#CE1126'], // Mavi-Sarı-Kırmızı
  'Slovenya': ['#FFFFFF', '#0057B8', '#FF0000'], // Beyaz-Mavi-Kırmızı
  'Slovakya': ['#FFFFFF', '#0B4EA2', '#EE1C25'], // Beyaz-Mavi-Kırmızı
  'Macaristan': ['#436F4D', '#FFFFFF', '#CD2A3E'], // Yeşil-Beyaz-Kırmızı
  'İrlanda': ['#169B62', '#FFFFFF', '#FF883E'], // Yeşil-Beyaz-Turuncu
  'İzlanda': ['#02529C', '#FFFFFF', '#DC1E35'], // Mavi-Beyaz-Kırmızı
  'Finlandiya': ['#FFFFFF', '#003580'], // Beyaz-Mavi
  'Sırbistan': ['#C6363C', '#FFFFFF', '#0C4076'], // Kırmızı-Beyaz-Mavi
  'Bulgaristan': ['#FFFFFF', '#00966E', '#D62612'], // Beyaz-Yeşil-Kırmızı
  'Ukrayna': ['#0057B7', '#FFD700'], // Mavi-Sarı
  'Kanada': ['#FF0000', '#FFFFFF'], // Kırmızı-Beyaz
  'ABD': ['#B22234', '#FFFFFF', '#3C3B6E'], // Kırmızı-Beyaz-Mavi
  'Japonya': ['#FFFFFF', '#BC002D'], // Beyaz-Kırmızı
  'Güney Kore': ['#FFFFFF', '#000000', '#CE1126', '#0047A0'], // Beyaz-Siyah-Kırmızı-Mavi
  'Çin': ['#DE2910', '#FFDE00'], // Kırmızı-Sarı
  'Avustralya': ['#00008B', '#FFFFFF', '#FF0000'], // Mavi-Beyaz-Kırmızı
  'Güney Afrika': ['#000000', '#FFB612', '#E1392D', '#007A4D', '#002395', '#FFFFFF'], // Siyah-Sarı-Kırmızı-Yeşil-Mavi-Beyaz
  'Nijerya': ['#008753', '#FFFFFF'], // Yeşil-Beyaz
  'Mısır': ['#CE1126', '#FFFFFF', '#000000'], // Kırmızı-Beyaz-Siyah
  'Fas': ['#C1272D', '#FFFFFF'], // Kırmızı-Beyaz
  'Tunus': ['#E70013', '#FFFFFF'], // Kırmızı-Beyaz
  'Senegal': ['#00853F', '#FCD116', '#CE1126'], // Yeşil-Sarı-Kırmızı
  'Gana': ['#006B3F', '#FCD116', '#CE1126', '#000000'], // Yeşil-Sarı-Kırmızı-Siyah
  'Fildişi Sahili': ['#F77F00', '#FFFFFF', '#009739'], // Turuncu-Beyaz-Yeşil
  'Kenya': ['#000000', '#FFFFFF', '#DE2910', '#006600'], // Siyah-Beyaz-Kırmızı-Yeşil
  'Kamerun': ['#007A5E', '#FCD116', '#CE1126'], // Yeşil-Sarı-Kırmızı
  'Cezayir': ['#FFFFFF', '#006233', '#D21034'], // Beyaz-Yeşil-Kırmızı
  'Irak': ['#CE1126', '#FFFFFF', '#000000'], // Kırmızı-Beyaz-Siyah
  'İran': ['#FFFFFF', '#DA0000', '#239F40'], // Beyaz-Kırmızı-Yeşil
  'Suudi Arabistan': ['#006C35', '#FFFFFF'], // Yeşil-Beyaz
  'BAE': ['#FF0000', '#FFFFFF', '#000000'], // Kırmızı-Beyaz-Siyah
  'Katar': ['#8B1538', '#FFFFFF'], // Koyu Kırmızı-Beyaz
  'Ürdün': ['#000000', '#FFFFFF', '#007A3D', '#CE1126'], // Siyah-Beyaz-Yeşil-Kırmızı
  'Lübnan': ['#ED1C24', '#FFFFFF', '#00A651'], // Kırmızı-Beyaz-Yeşil
  'Suriye': ['#FFFFFF', '#000000', '#CE1126', '#007A3D'], // Beyaz-Siyah-Kırmızı-Yeşil
  'Filistin': ['#007A3D', '#FFFFFF', '#000000', '#CE1126'], // Yeşil-Beyaz-Siyah-Kırmızı
  'İsrail': ['#FFFFFF', '#0038B8'], // Beyaz-Mavi
  'Tayland': ['#ED1C24', '#FFFFFF', '#241D4F'], // Kırmızı-Beyaz-Mavi
  'Vietnam': ['#DA251D', '#FFCE00'], // Kırmızı-Sarı
  'Endonezya': ['#FF0000', '#FFFFFF'], // Kırmızı-Beyaz
  'Malezya': ['#FFFFFF', '#006644', '#CE1126', '#0000FF', '#FFD700'], // Beyaz-Yeşil-Kırmızı-Mavi-Sarı
  'Singapur': ['#EF3340', '#FFFFFF'], // Kırmızı-Beyaz
  'Filipinler': ['#0038A8', '#FFFFFF', '#CE1126', '#FFD700'], // Mavi-Beyaz-Kırmızı-Sarı
  'Myanmar': ['#FECB00', '#34B233', '#EA2839'], // Sarı-Yeşil-Kırmızı
  'Bangladeş': ['#006A4E', '#F42A41'], // Yeşil-Kırmızı
  'Pakistan': ['#FFFFFF', '#01411C'], // Beyaz-Yeşil
  'Sri Lanka': ['#FFBE29', '#8D1538', '#00534E', '#FFBE29'], // Sarı-Kırmızı-Yeşil-Sarı
  'Hindistan': ['#FF9933', '#FFFFFF', '#138808'], // Turuncu-Beyaz-Yeşil
  'Afganistan': ['#000000', '#CE1126', '#009639'], // Siyah-Kırmızı-Yeşil
  'Kazakistan': ['#00AFCA', '#FFE700'], // Mavi-Sarı
  'Özbekistan': ['#1EB53A', '#FFFFFF', '#0099B5', '#CE1126'], // Yeşil-Beyaz-Mavi-Kırmızı
  'Türkmenistan': ['#27AE60', '#FFFFFF', '#E30A17'], // Yeşil-Beyaz-Kırmızı
  'Kırgızistan': ['#FF0000', '#FFD700'], // Kırmızı-Sarı
  'Tacikistan': ['#0C6138', '#FFFFFF', '#DE2910', '#FFCE02'], // Yeşil-Beyaz-Kırmızı-Sarı
  'Ermenistan': ['#D90012', '#0033A0', '#F2A800'], // Kırmızı-Mavi-Sarı
  'Gürcistan': ['#FFFFFF', '#FF0000'], // Beyaz-Kırmızı
  'Azerbaycan': ['#00AFCA', '#E30A17', '#009639'], // Mavi-Kırmızı-Yeşil
  'Belarus': ['#FFD700', '#006B3F', '#DA020E'], // Sarı-Yeşil-Kırmızı
  'Litvanya': ['#FFD700', '#006A44', '#C1272D'], // Sarı-Yeşil-Kırmızı
  'Letonya': ['#9E3039', '#FFFFFF'], // Kırmızı-Beyaz
  'Estonya': ['#FFFFFF', '#000080', '#000000'], // Beyaz-Mavi-Siyah
  'Moldova': ['#FFCC02', '#0033A0', '#CC0000'], // Sarı-Mavi-Kırmızı
  'Arnavutluk': ['#E30A17', '#000000'], // Kırmızı-Siyah
  'Kuzey Makedonya': ['#CE2029', '#FFD700'], // Kırmızı-Sarı
  'Bosna Hersek': ['#002395', '#FFFFFF', '#FFCC00', '#009639'], // Mavi-Beyaz-Sarı-Yeşil
  'Karadağ': ['#CE2029', '#FFD700'], // Kırmızı-Sarı
  'Kosova': ['#244AA5', '#FFFFFF', '#D21034', '#FFCE02'], // Mavi-Beyaz-Kırmızı-Sarı
  'Kıbrıs': ['#FFFFFF', '#006600'], // Beyaz-Yeşil
  'Malta': ['#FFFFFF', '#CE1126'], // Beyaz-Kırmızı
  'Lüksemburg': ['#00A1DE', '#FFFFFF', '#EF3340'], // Mavi-Beyaz-Kırmızı
  'Andorra': ['#0018A8', '#FFD700', '#C8102E'], // Mavi-Sarı-Kırmızı
  'San Marino': ['#FFFFFF', '#5CACEE'], // Beyaz-Mavi
  'Lihtenştayn': ['#002B7F', '#FF0000'], // Mavi-Kırmızı
  'Vatikan': ['#FFE600', '#FFFFFF', '#FF0000'], // Sarı-Beyaz-Kırmızı
  'Monaco': ['#FFFFFF', '#CE1126'], // Beyaz-Kırmızı
  'Cebelitarık': ['#FFFFFF', '#CE1126', '#0000FF'], // Beyaz-Kırmızı-Mavi
  'Ekvador': ['#FFD700', '#0033A0', '#CC0000'], // Sarı-Mavi-Kırmızı
  'Paraguay': ['#0038A8', '#FFFFFF', '#CE1126'], // Mavi-Beyaz-Kırmızı
  'Bolivya': ['#007A33', '#FFD700', '#CE1126'], // Yeşil-Sarı-Kırmızı
  'Venezuela': ['#FFCC02', '#0033A0', '#CC0000'], // Sarı-Mavi-Kırmızı
  'Guyana': ['#009639', '#FFFFFF', '#FFCC02', '#000000', '#CE1126'], // Yeşil-Beyaz-Sarı-Siyah-Kırmızı
  'Surinam': ['#377E3F', '#FFFFFF', '#B40A2D', '#FFD700'], // Yeşil-Beyaz-Kırmızı-Sarı
  'Guatemala': ['#4997D0', '#FFFFFF'], // Mavi-Beyaz
  'Honduras': ['#006847', '#FFFFFF'], // Yeşil-Beyaz
  'El Salvador': ['#006847', '#FFFFFF', '#0000FF'], // Yeşil-Beyaz-Mavi
  'Kosta Rika': ['#00247D', '#FFFFFF', '#CE1126'], // Mavi-Beyaz-Kırmızı
  'Panama': ['#FFFFFF', '#005293', '#D21034'], // Beyaz-Mavi-Kırmızı
  'Nikaragua': ['#0067CE', '#FFFFFF'], // Mavi-Beyaz
  'Belize': ['#003F87', '#D21034'], // Mavi-Kırmızı
  'Jamaika': ['#009639', '#FFD700', '#000000'], // Yeşil-Sarı-Siyah
  'Haiti': ['#00209F', '#FFFFFF', '#D21034'], // Mavi-Beyaz-Kırmızı
  'Küba': ['#002A8F', '#FFFFFF', '#CE1126'], // Mavi-Beyaz-Kırmızı
  'Trinidad ve Tobago': ['#CE1126', '#FFFFFF', '#000000'], // Kırmızı-Beyaz-Siyah
  'Barbados': ['#00267F', '#FFD700', '#000000'], // Mavi-Sarı-Siyah
  'Grenada': ['#CE1126', '#FFD700', '#006600'], // Kırmızı-Sarı-Yeşil
  'Dominika': ['#009639', '#FFD700', '#000000', '#FFFFFF', '#D21034'], // Yeşil-Sarı-Siyah-Beyaz-Kırmızı
  'Saint Lucia': ['#6CF', '#FFFFFF', '#000000', '#FFD700'], // Mavi-Beyaz-Siyah-Sarı
  'Saint Vincent ve Grenadinler': ['#009639', '#FFD700', '#000000', '#0066CC'], // Yeşil-Sarı-Siyah-Mavi
  'Antigua ve Barbuda': ['#000000', '#FF0000', '#0066CC', '#FFFFFF', '#FFD700'], // Siyah-Kırmızı-Mavi-Beyaz-Sarı
  'Saint Kitts ve Nevis': ['#009639', '#FFD700', '#000000', '#CE1126', '#FFFFFF'], // Yeşil-Sarı-Siyah-Kırmızı-Beyaz
  'Dominik Cumhuriyeti': ['#00247D', '#FFFFFF', '#CE1126'], // Mavi-Beyaz-Kırmızı
  'Porto Riko': ['#FFFFFF', '#CE1126', '#00247D'], // Beyaz-Kırmızı-Mavi
  'Bahamalar': ['#00ABC9', '#FFD700', '#000000'], // Mavi-Sarı-Siyah
  'Bermuda': ['#EF3340', '#FFFFFF', '#00247D'], // Kırmızı-Beyaz-Mavi
  'Zimbabve': ['#009739', '#FFD700', '#000000', '#CE1126', '#FFFFFF'], // Yeşil-Sarı-Siyah-Kırmızı-Beyaz
  'Zambiya': ['#009639', '#FF0000', '#000000', '#FFD700'], // Yeşil-Kırmızı-Siyah-Sarı
  'Tanzanya': ['#1EB53A', '#FFD700', '#000000', '#006600'], // Yeşil-Sarı-Siyah-Yeşil
  'Uganda': ['#000000', '#FFD700', '#CE1126', '#FFFFFF'], // Siyah-Sarı-Kırmızı-Beyaz
  'Ruanda': ['#009639', '#FFD700', '#0000FF', '#CE1126'], // Yeşil-Sarı-Mavi-Kırmızı
  'Botsvana': ['#75AADB', '#FFFFFF', '#000000'], // Mavi-Beyaz-Siyah
  'Namibya': ['#009639', '#FFFFFF', '#0038A8', '#CE1126', '#FFD700'], // Yeşil-Beyaz-Mavi-Kırmızı-Sarı
  'Lesotho': ['#009639', '#FFFFFF', '#0038A8'], // Yeşil-Beyaz-Mavi
  'Esvatini': ['#000000', '#FF0000', '#FFD700', '#FFFFFF', '#0038A8'], // Siyah-Kırmızı-Sarı-Beyaz-Mavi
  'Malavi': ['#CE1126', '#FFD700', '#000000'], // Kırmızı-Sarı-Siyah
  'Mozambik': ['#009639', '#FFFFFF', '#000000', '#FFD700', '#CE1126'], // Yeşil-Beyaz-Siyah-Sarı-Kırmızı
  'Angola': ['#FF0000', '#000000'], // Kırmızı-Siyah
  'Kongo DC': ['#009639', '#FFD700', '#0000FF'], // Yeşil-Sarı-Mavi
  'Kongo Cumhuriyeti': ['#009639', '#FFD700', '#CE1126'], // Yeşil-Sarı-Kırmızı
  'Gabon': ['#009639', '#FFD700', '#0038A8'], // Yeşil-Sarı-Mavi
  'Ekvator Ginesi': ['#009639', '#FFFFFF', '#CE1126', '#0038A8'], // Yeşil-Beyaz-Kırmızı-Mavi
  'Çad': ['#009639', '#FFD700', '#CE1126'], // Yeşil-Sarı-Kırmızı
  'Sudan': ['#009639', '#FFFFFF', '#000000', '#CE1126'], // Yeşil-Beyaz-Siyah-Kırmızı
  'Eritre': ['#009639', '#FFD700', '#CE1126', '#0038A8'], // Yeşil-Sarı-Kırmızı-Mavi
  'Etiyopya': ['#009639', '#FFD700', '#CE1126'], // Yeşil-Sarı-Kırmızı
  'Cibuti': ['#009639', '#FFFFFF', '#0038A8', '#CE1126'], // Yeşil-Beyaz-Mavi-Kırmızı
  'Somali': ['#4189DD', '#FFFFFF'], // Mavi-Beyaz
  'Mauritius': ['#FF0000', '#FFFFFF', '#0038A8', '#009639'], // Kırmızı-Beyaz-Mavi-Yeşil
  'Seyşeller': ['#0038A8', '#FFFFFF', '#009639', '#CE1126', '#FFD700'], // Mavi-Beyaz-Yeşil-Kırmızı-Sarı
  'Komorlar': ['#009639', '#FFFFFF', '#0038A8', '#CE1126', '#FFD700'], // Yeşil-Beyaz-Mavi-Kırmızı-Sarı
  'Maldivler': ['#CE1126', '#FFFFFF', '#009639'], // Kırmızı-Beyaz-Yeşil
  'Bhutan': ['#FFD700', '#FF0000'], // Sarı-Kırmızı
  'Nepal': ['#CE1126', '#0038A8', '#FFFFFF'], // Kırmızı-Mavi-Beyaz
  'Moğolistan': ['#CE1126', '#0038A8', '#FFD700'], // Kırmızı-Mavi-Sarı
  'Kuzey Kore': ['#024FA2', '#FFFFFF', '#ED1C24', '#FFD700'], // Mavi-Beyaz-Kırmızı-Sarı
  'Amerikan Samoası': ['#0038A8', '#FFFFFF', '#CE1126'], // Mavi-Beyaz-Kırmızı
  'Samoa': ['#CE1126', '#0038A8', '#FFFFFF'], // Kırmızı-Mavi-Beyaz
  'Tonga': ['#CE1126', '#FFFFFF'], // Kırmızı-Beyaz
  'Fiji': ['#0038A8', '#FFFFFF', '#CE1126'], // Mavi-Beyaz-Kırmızı
  'Papua Yeni Gine': ['#000000', '#FF0000', '#FFD700'], // Siyah-Kırmızı-Sarı
  'Solomon Adaları': ['#0038A8', '#009639', '#FFFFFF', '#FFD700', '#CE1126'], // Mavi-Yeşil-Beyaz-Sarı-Kırmızı
  'Vanuatu': ['#009639', '#FFD700', '#CE1126', '#000000'], // Yeşil-Sarı-Kırmızı-Siyah
  'Yeni Kaledonya': ['#0038A8', '#FFFFFF', '#CE1126'], // Mavi-Beyaz-Kırmızı
  'Fransız Polinezyası': ['#0038A8', '#FFFFFF', '#CE1126'], // Mavi-Beyaz-Kırmızı
  'Guam': ['#0038A8', '#FF0000'], // Mavi-Kırmızı
  'Palau': ['#009639', '#FFD700'], // Yeşil-Sarı
  'Mikronezya': ['#0038A8', '#FFFFFF'], // Mavi-Beyaz
  'Marshall Adaları': ['#0038A8', '#FFFFFF', '#FFD700', '#009639'], // Mavi-Beyaz-Sarı-Yeşil
  'Nauru': ['#0038A8', '#FFD700'], // Mavi-Sarı
  'Kiribati': ['#FF0000', '#FFFFFF', '#0038A8', '#FFD700'], // Kırmızı-Beyaz-Mavi-Sarı
  'Tuvalu': ['#0038A8', '#FFFFFF', '#FFD700', '#009639', '#CE1126'], // Mavi-Beyaz-Sarı-Yeşil-Kırmızı
};

// Ülke adından renkleri al
const getNationalTeamColors = (countryName: string): string[] => {
  return NATIONAL_TEAM_COLORS[countryName] || ['#1FA2A6', '#0F2A24']; // Default colors
};

// Logo ve spacing constants - Tüm giriş ekranlarında aynı (200px)
const LOGO_SIZE = 200;
const LOGO_MARGIN_TOP = 10;
const LOGO_MARGIN_BOTTOM = 6;

export default function ProfileSetupScreen({
  onComplete,
  onBack,
}: ProfileSetupScreenProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<SetupStep>('profile');
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedNationalTeam, setSelectedNationalTeam] = useState<Team | null>(null);
  const [selectedClubTeams, setSelectedClubTeams] = useState<Team[]>([]);
  
  // Team selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [apiTeams, setApiTeams] = useState<Team[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamModalType, setTeamModalType] = useState<'national' | 'club' | null>(null);
  const [showNationalDropdown, setShowNationalDropdown] = useState(false);
  const [nationalTeamSearch, setNationalTeamSearch] = useState('');
  
  // Animation
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  // Check user plan
  useEffect(() => {
    const checkUserPlan = async () => {
      try {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        if (userData) {
          const user = JSON.parse(userData);
          setIsPro(user.isPro || user.is_pro || user.plan === 'pro');
        }
      } catch (error) {
        console.error('Error checking user plan:', error);
      }
    };
    checkUserPlan();
  }, []);
  
  // Animate step transition
  const animateTransition = (direction: 'forward' | 'backward', callback?: () => void) => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
      }),
      Animated.timing(translateX, {
        toValue: direction === 'forward' ? -50 : 50,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
      }),
      Animated.timing(scale, {
        toValue: 0.98,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
      }),
    ]).start(() => {
      if (callback) callback();
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
        }),
      ]).start();
    });
  };
  
  // Avatar seçimi
  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin vermeniz gerekiyor.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  const handleTakeAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermeniz gerekiyor.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    }
  };

  const handleNext = () => {
    if (currentStep === 'profile') {
      if (!nickname.trim() || nickname.trim().length < 3) {
        Alert.alert('Hata', 'Nickname en az 3 karakter olmalıdır');
        return;
      }
      animateTransition('forward', () => setCurrentStep('national-team'));
    } else if (currentStep === 'national-team') {
      // Free plan için milli takım zorunlu
      if (!isPro && !selectedNationalTeam) {
        Alert.alert('Hata', 'Free plan için milli takım seçimi zorunludur');
        return;
      }
      // Pro plan için milli takım opsiyonel, kulüp takımlarına geç
      if (isPro) {
        animateTransition('forward', () => setCurrentStep('club-teams'));
      } else {
        handleComplete();
      }
    } else if (currentStep === 'club-teams') {
      // Pro plan için en az 1 takım seçilmeli
      if (isPro && selectedClubTeams.length === 0) {
        Alert.alert('Bilgi', 'Pro plan için en az 1 kulüp takımı seçmelisiniz');
        return;
      }
      handleComplete();
    }
  };
  
  const handleBack = () => {
    if (currentStep === 'profile') {
      if (onBack) onBack();
    } else if (currentStep === 'national-team') {
      animateTransition('backward', () => setCurrentStep('profile'));
    } else if (currentStep === 'club-teams') {
      animateTransition('backward', () => setCurrentStep('national-team'));
    }
  };
  
  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save profile data
      const profileData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname.trim(),
        avatar: avatarUri,
        nationalTeam: selectedNationalTeam,
        clubTeams: selectedClubTeams,
        profileSetupComplete: true,
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_SETUP, JSON.stringify(profileData));
      
      // Update user data
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        const user = JSON.parse(userData);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
          ...user,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          nickname: nickname.trim(),
          profileSetupComplete: true,
        }));
      }
      
      logger.info('Profile setup complete', { nickname, teamCount: selectedClubTeams.length }, 'PROFILE_SETUP');
      
      // Navigate to dashboard
      setTimeout(() => {
        onComplete();
      }, 300);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Hata', 'Profil kaydedilirken bir hata oluştu');
      setLoading(false);
    }
  };
  
  const searchTeams = async (query: string, type: 'national' | 'club') => {
    if (query.length < 2) {
      setApiTeams([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await teamsApi.searchTeams(query);
      // Filter teams by type if response has data
      let filteredTeams: Team[] = [];
      if (response && response.data) {
        filteredTeams = response.data.filter((team: any) => {
          // If team has type property, filter by it
          if (team.type) {
            return team.type === type;
          }
          // Otherwise, try to determine from team properties
          // National teams usually have country but no league
          if (type === 'national') {
            return team.country && (!team.league || team.league === 'National');
          } else {
            return team.league && team.league !== 'National';
          }
        });
      }
      setApiTeams(filteredTeams);
    } catch (error) {
      console.error('Error searching teams:', error);
      setApiTeams([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleTeamSelect = (team: Team, type: 'national' | 'club') => {
    if (type === 'national') {
      setSelectedNationalTeam(team);
      setShowTeamModal(false);
    } else {
      if (selectedClubTeams.length >= 5) {
        Alert.alert('Limit', 'En fazla 5 kulüp takımı seçebilirsiniz');
        return;
      }
      if (selectedClubTeams.some(t => t.id === team.id)) {
        Alert.alert('Bilgi', 'Bu takım zaten seçili');
        return;
      }
      setSelectedClubTeams([...selectedClubTeams, team]);
      setShowTeamModal(false);
      setSearchQuery('');
    }
  };
  
  const handleTeamRemove = (teamId: number, type: 'national' | 'club') => {
    if (type === 'national') {
      setSelectedNationalTeam(null);
    } else {
      setSelectedClubTeams(selectedClubTeams.filter(t => t.id !== teamId));
    }
  };
  
  const getStepTitle = () => {
    switch (currentStep) {
      case 'profile':
        return 'Profil Bilgileri';
      case 'national-team':
        return 'Milli Takım Seçimi';
      case 'club-teams':
        return 'Kulüp Takımları';
      default:
        return '';
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'profile':
        return 1;
      case 'national-team':
        return 2;
      case 'club-teams':
        return 3;
      default:
        return 1;
    }
  };
  
  const renderProfileStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepSubtitle}>Profil bilgilerinizi tamamlayın</Text>
      
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          onPress={() => setShowAvatarPicker(true)}
          style={styles.avatarContainer}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={WEBSITE_BRAND_COLORS.secondary} />
              </View>
            )}
          </View>
          <View style={styles.avatarEditButton}>
            <Ionicons name="camera" size={16} color={WEBSITE_BRAND_COLORS.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarLabel}>Profil Fotoğrafı (Opsiyonel)</Text>
      </View>
      
      {/* Name Fields */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>İsim</Text>
        <TextInput
          style={styles.input}
          placeholder="İsminiz"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Soyisim</Text>
        <TextInput
          style={styles.input}
          placeholder="Soyisminiz"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />
      </View>
      
      {/* Nickname Field */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nickname <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Kullanıcı adınız"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={nickname}
          onChangeText={setNickname}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.helperText}>En az 3 karakter (zorunlu)</Text>
      </View>
    </View>
  );
  
  const renderNationalTeamStep = () => {
    // Filter teams based on search
    const filteredNationalTeams = NATIONAL_TEAMS.filter(team =>
      team.toLowerCase().includes(nationalTeamSearch.toLowerCase())
    );
    
    // Extract country name from team string (remove flag emoji)
    const getCountryName = (teamString: string) => {
      // Remove flag emoji (regular flag emojis)
      return teamString.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '').trim();
    };
    
    // Extract flag emoji from team string
    const getFlagEmoji = (teamString: string): string | null => {
      // Try to match regular flag emojis (2-letter country codes like 🇹🇷, 🇬🇧)
      // Match at the start of the string
      const regularFlagMatch = teamString.match(/^[\u{1F1E6}-\u{1F1FF}]{2}/u);
      if (regularFlagMatch) {
        return regularFlagMatch[0];
      }
      return null;
    };
    
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepSubtitle}>
          {isPro ? 'Milli takım seçimi (Opsiyonel)' : 'Milli takım seçimi (Zorunlu)'}
        </Text>
        
        {/* Dropdown Button */}
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => {
            setShowNationalDropdown(!showNationalDropdown);
            if (!showNationalDropdown) {
              setNationalTeamSearch('');
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.dropdownButtonContent}>
            <Text style={[
              styles.dropdownButtonText,
              !selectedNationalTeam && styles.dropdownButtonTextPlaceholder
            ]}>
              {selectedNationalTeam 
                ? `${selectedNationalTeam.name}`
                : 'Milli Takım Seç'
              }
            </Text>
            {selectedNationalTeam && (() => {
              const team = NATIONAL_TEAMS.find(t => {
                const countryName = t.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*|🏴[^\s]*\s*/u, '').trim();
                return countryName === selectedNationalTeam.name;
              });
              if (!team) return null;
              // Extract flag emoji - use getFlagEmoji helper
              const flag = getFlagEmoji(team);
              return flag ? (
                <Text style={styles.dropdownButtonFlag}>{flag}</Text>
              ) : null;
            })()}
          </View>
          <Ionicons 
            name={showNationalDropdown ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={WEBSITE_BRAND_COLORS.white} 
          />
        </TouchableOpacity>
        
        {/* Dropdown Menu */}
        {showNationalDropdown && (
          <View style={styles.dropdownContainer}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.5)" style={styles.searchIcon} />
              <TextInput
                style={styles.dropdownSearchInput}
                placeholder="Milli takım ara..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={nationalTeamSearch}
                onChangeText={setNationalTeamSearch}
                autoCapitalize="none"
              />
            </View>
            
            {/* Teams List - Scrollable */}
            <View style={styles.dropdownList}>
              <FlatList
                data={filteredNationalTeams}
                keyExtractor={(item, index) => `national-${index}`}
                renderItem={({ item, index }) => {
                  const countryName = getCountryName(item);
                  const isSelected = selectedNationalTeam?.name === countryName;
                  
                  return (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        const teamData: Team = {
                          id: index + 1,
                          name: countryName,
                          country: countryName,
                          league: 'National',
                          colors: ['#1FA2A6', '#0F2A24'],
                          type: 'national',
                        };
                        setSelectedNationalTeam(teamData);
                        setShowNationalDropdown(false);
                        setNationalTeamSearch('');
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownItemContent}>
                        <Text style={styles.dropdownItemText} numberOfLines={1}>
                          {getCountryName(item)}
                        </Text>
                        {(() => {
                          const flag = getFlagEmoji(item);
                          return flag ? (
                            <Text style={styles.flagEmoji} allowFontScaling={false}>
                              {flag}
                            </Text>
                          ) : null;
                        })()}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color={WEBSITE_BRAND_COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.dropdownEmpty}>
                    <Text style={styles.dropdownEmptyText}>Sonuç bulunamadı</Text>
                  </View>
                }
                style={{ maxHeight: 300 }}
                nestedScrollEnabled
              />
            </View>
          </View>
        )}
        
        {/* Selected Team Display */}
        {selectedNationalTeam && !showNationalDropdown && (
          <TouchableOpacity
            style={styles.selectedTeamCard}
            onPress={() => {
              setSelectedNationalTeam(null);
            }}
          >
            <View style={[styles.teamColorBar, { backgroundColor: selectedNationalTeam.colors[0] || '#1FA2A6' }]} />
            <View style={styles.teamCardContent}>
              <Text style={styles.teamName}>{selectedNationalTeam.name}</Text>
              <Text style={styles.teamLeague}>Milli Takım</Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={(e) => {
                e.stopPropagation();
                handleTeamRemove(selectedNationalTeam.id, 'national');
              }}
            >
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  const renderClubTeamsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepSubtitle}>Favori kulüp takımlarınızı seçin (Max 5)</Text>
      <Text style={styles.helperText}>
        {selectedClubTeams.length}/5 seçili
      </Text>
      
      {selectedClubTeams.length > 0 && (
        <View style={styles.selectedTeamsList}>
          {selectedClubTeams.map((team) => (
            <View key={team.id} style={styles.selectedTeamCard}>
              <View style={[styles.teamColorBar, { backgroundColor: team.colors[0] || '#1FA2A6' }]} />
              <View style={styles.teamCardContent}>
                <Text style={styles.teamName}>{team.name}</Text>
                {team.coach && <Text style={styles.teamCoach}>{team.coach}</Text>}
                <Text style={styles.teamLeague}>{team.league}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleTeamRemove(team.id, 'club')}
              >
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      {selectedClubTeams.length < 5 && (
        <TouchableOpacity
          style={styles.selectTeamButton}
          onPress={() => {
            setTeamModalType('club');
            setShowTeamModal(true);
          }}
        >
          <Text style={styles.selectTeamButtonText}>+ Takım Ekle</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  const renderTeamModal = () => {
    if (!showTeamModal || !teamModalType) return null;
    
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {teamModalType === 'national' ? 'Milli Takım Ara' : 'Kulüp Takımı Ara'}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowTeamModal(false);
                setSearchQuery('');
                setApiTeams([]);
              }}
            >
              <Ionicons name="close" size={24} color={WEBSITE_BRAND_COLORS.white} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.searchInput}
            placeholder="Takım ara..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchTeams(text, teamModalType);
            }}
            autoCapitalize="none"
          />
          
          {isSearching && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={WEBSITE_BRAND_COLORS.primary} />
            </View>
          )}
          
          <View style={styles.teamList}>
            {apiTeams.map((team) => (
              <TouchableOpacity
                key={team.id}
                style={styles.teamListItem}
                onPress={() => handleTeamSelect(team, teamModalType)}
              >
                <View style={[styles.teamColorBar, { backgroundColor: team.colors[0] || '#1FA2A6' }]} />
                <View style={styles.teamCardContent}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  {team.coach && <Text style={styles.teamCoach}>{team.coach}</Text>}
                  <Text style={styles.teamLeague}>
                    {teamModalType === 'national' ? team.country : team.league}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Back Button */}
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={WEBSITE_ICON_SIZES.lg} color={WEBSITE_BRAND_COLORS.white} />
        </TouchableOpacity>
      )}
      
      <View style={styles.content}>
        
        {/* Progress Indicator */}
        <View style={styles.progressRow}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.progressDotContainer}>
              <View
                style={[
                  styles.progressDot,
                  step <= getStepNumber() && styles.progressDotActive,
                ]}
              />
              {step < 3 && (
                <View
                  style={[
                    styles.progressLine,
                    step < getStepNumber() && styles.progressLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>
        
        {/* Step Title */}
        <Text style={styles.stepTitle}>{getStepTitle()}</Text>
        
        {/* Step Content */}
        <Animated.View
          style={[
            styles.animatedContent,
            {
              opacity,
              transform: [{ translateX }, { scale }],
            },
          ]}
        >
          {currentStep === 'profile' && renderProfileStep()}
          {currentStep === 'national-team' && renderNationalTeamStep()}
          {currentStep === 'club-teams' && renderClubTeamsStep()}
        </Animated.View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {currentStep !== 'profile' && (
            <TouchableOpacity style={styles.backButtonAction} onPress={handleBack}>
              <Text style={styles.backButtonText}>Geri</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={loading}
          >
            <LinearGradient
              colors={[WEBSITE_BRAND_COLORS.secondary, WEBSITE_BRAND_COLORS.primary]}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={WEBSITE_BRAND_COLORS.white} />
              ) : (
                <Text style={styles.nextButtonText}>
                  {currentStep === 'club-teams' ? 'Tamamla' : 'Devam Et'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Team Selection Modal */}
      {renderTeamModal()}
      
      {/* Avatar Picker Modal */}
      <Modal
        visible={showAvatarPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profil Fotoğrafı Seç</Text>
              <TouchableOpacity onPress={() => setShowAvatarPicker(false)}>
                <Ionicons name="close" size={24} color={WEBSITE_DARK_COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={async () => {
                await handleTakeAvatar();
                setShowAvatarPicker(false);
              }}
            >
              <Ionicons name="camera" size={24} color={WEBSITE_BRAND_COLORS.secondary} />
              <Text style={styles.modalOptionText}>Fotoğraf Çek</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={async () => {
                await handlePickAvatar();
                setShowAvatarPicker(false);
              }}
            >
              <Ionicons name="images" size={24} color={WEBSITE_BRAND_COLORS.secondary} />
              <Text style={styles.modalOptionText}>Galeriden Seç</Text>
            </TouchableOpacity>
            {avatarUri && (
              <TouchableOpacity 
                style={[styles.modalOption, styles.modalOptionDanger]}
                onPress={() => {
                  setAvatarUri(null);
                  setShowAvatarPicker(false);
                }}
              >
                <Ionicons name="trash" size={24} color={WEBSITE_BRAND_COLORS.error} />
                <Text style={[styles.modalOptionText, styles.modalOptionTextDanger]}>Fotoğrafı Kaldır</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WEBSITE_DARK_COLORS.background,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: WEBSITE_BORDER_RADIUS.md,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: WEBSITE_SPACING.lg,
    paddingTop: 100,
    zIndex: 1, // Watermark'ın üstünde olması için
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressDotActive: {
    backgroundColor: WEBSITE_BRAND_COLORS.primary,
  },
  progressLine: {
    width: 28,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 6,
  },
  progressLineActive: {
    backgroundColor: WEBSITE_BRAND_COLORS.primary,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WEBSITE_BRAND_COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  animatedContent: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: WEBSITE_BRAND_COLORS.white,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    borderRadius: WEBSITE_BORDER_RADIUS.md,
    paddingHorizontal: 16,
    color: WEBSITE_BRAND_COLORS.white,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  required: {
    color: WEBSITE_BRAND_COLORS.error,
  },
  // Avatar Styles
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: WEBSITE_BRAND_COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: WEBSITE_DARK_COLORS.background,
  },
  avatarLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  // Modal Styles
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderRadius: WEBSITE_BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  modalOptionDanger: {
    borderColor: WEBSITE_BRAND_COLORS.error,
    backgroundColor: 'rgba(140, 58, 58, 0.1)',
  },
  modalOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: WEBSITE_BRAND_COLORS.white,
    fontWeight: '500',
  },
  modalOptionTextDanger: {
    color: WEBSITE_BRAND_COLORS.error,
  },
  selectTeamButton: {
    height: 48,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    borderRadius: WEBSITE_BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectTeamButtonText: {
    color: WEBSITE_BRAND_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  selectedTeamsList: {
    marginBottom: 16,
  },
  selectedTeamCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderRadius: WEBSITE_BORDER_RADIUS.md,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  teamColorBar: {
    width: 4,
    backgroundColor: '#1FA2A6',
  },
  teamCardContent: {
    flex: 1,
    padding: 16,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WEBSITE_BRAND_COLORS.white,
    marginBottom: 4,
  },
  teamCoach: {
    fontSize: 14,
    color: WEBSITE_BRAND_COLORS.secondary,
    marginBottom: 2,
  },
  teamLeague: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  removeButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  backButtonAction: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    borderRadius: WEBSITE_BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: WEBSITE_BRAND_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    height: 48,
    borderRadius: WEBSITE_BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: WEBSITE_BRAND_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: WEBSITE_DARK_COLORS.background,
    borderRadius: WEBSITE_BORDER_RADIUS.lg,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WEBSITE_BRAND_COLORS.white,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    height: 44,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    borderRadius: WEBSITE_BORDER_RADIUS.md,
    paddingHorizontal: 16,
    color: WEBSITE_BRAND_COLORS.white,
    fontSize: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  teamList: {
    maxHeight: 400,
  },
  teamListItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderRadius: WEBSITE_BORDER_RADIUS.md,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  // Dropdown Styles
  dropdownButton: {
    height: 48,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    borderRadius: WEBSITE_BORDER_RADIUS.md,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dropdownButtonText: {
    color: WEBSITE_BRAND_COLORS.white,
    fontSize: 16,
    flex: 1,
  },
  dropdownButtonTextPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownButtonFlag: {
    fontSize: 20,
    marginLeft: 8,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  dropdownContainer: {
    backgroundColor: 'rgba(15, 42, 36, 0.98)',
    borderRadius: WEBSITE_BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    marginBottom: 12,
    maxHeight: 350,
    zIndex: 1000,
    ...(Platform.OS === 'web' ? {} : {
      elevation: 5,
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.2)',
  },
  searchIcon: {
    marginRight: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    height: 40,
    color: WEBSITE_BRAND_COLORS.white,
    fontSize: 14,
  },
  dropdownList: {
    maxHeight: 280,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.1)',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    gap: 8,
  },
  flagEmoji: {
    fontSize: 20,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  dropdownItemText: {
    color: WEBSITE_BRAND_COLORS.white,
    fontSize: 15,
    flex: 1,
  },
  dropdownEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
});
