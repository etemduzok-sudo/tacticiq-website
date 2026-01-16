import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { Card, CardContent } from '@/app/components/ui/card';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Users, Target, Zap, Globe, Linkedin, Twitter } from 'lucide-react';

export function AboutSection() {
  const { t } = useLanguage();
  const adminData = useAdminDataSafe();

  // Admin kontrolü - bölüm kapalıysa hiç render etme
  if (!adminData?.sectionSettings?.about?.enabled) {
    return null;
  }

  const { sectionSettings, teamMembers } = adminData;
  const showTeam = sectionSettings.about.showTeam;
  const showMission = sectionSettings.about.showMission;

  // Sadece enabled olan ve sıralanmış ekip üyelerini göster
  const activeTeam = teamMembers
    .filter(member => member.enabled)
    .sort((a, b) => a.order - b.order);

  const values = [
    {
      icon: Target,
      title: t('about.values.accuracy.title'),
      description: t('about.values.accuracy.description'),
    },
    {
      icon: Zap,
      title: t('about.values.innovation.title'),
      description: t('about.values.innovation.description'),
    },
    {
      icon: Globe,
      title: t('about.values.accessibility.title'),
      description: t('about.values.accessibility.description'),
    },
    {
      icon: Users,
      title: t('about.values.community.title'),
      description: t('about.values.community.description'),
    },
  ];

  return (
    <section id="about" className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            <Users className="size-4" />
            {t('about.badge')}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('about.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Mission Statement */}
        {showMission && (
          <div className="max-w-4xl mx-auto mb-20">
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-8 md:p-12">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-center">
                  {t('about.mission.title')}
                </h3>
                <p className="text-lg text-muted-foreground text-center leading-relaxed">
                  {t('about.mission.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Values */}
        <div className="mb-20">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">
            {t('about.values.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="size-7 text-secondary" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">{value.title}</h4>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team */}
        {showTeam && activeTeam.length > 0 && (
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">
              {t('about.team.title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {activeTeam.map((member, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Avatar className="size-24 mx-auto mb-4">
                      <AvatarFallback className="bg-gradient-to-br from-secondary to-accent text-white text-2xl font-bold">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <h4 className="font-bold text-lg mb-1">{member.name}</h4>
                    <p className="text-sm text-secondary font-semibold mb-3">{member.role}</p>
                    <p className="text-xs text-muted-foreground mb-4">{member.bio}</p>
                    <div className="flex gap-2 justify-center">
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-muted hover:bg-secondary/10 flex items-center justify-center transition-colors"
                        >
                          <Linkedin className="size-4 text-secondary" />
                        </a>
                      )}
                      {member.twitter && (
                        <a
                          href={member.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-muted hover:bg-secondary/10 flex items-center justify-center transition-colors"
                        >
                          <Twitter className="size-4 text-secondary" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Stats - Admin kontrollü */}
        {adminData?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{adminData.stats.foundedYear ?? 2026}</div>
            <p className="text-sm text-muted-foreground">{t('about.stats.founded')}</p>
          </div>
          <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{adminData.stats.totalUsers || '0.0K+'}</div>
            <p className="text-sm text-muted-foreground">{t('about.stats.users')}</p>
          </div>
          <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{adminData.stats.totalLeagues ?? 25}+</div>
            <p className="text-sm text-muted-foreground">{t('about.stats.leagues')}</p>
          </div>
          <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{adminData.stats.totalLanguages ?? 8}</div>
            <p className="text-sm text-muted-foreground">{t('about.stats.languages')}</p>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}