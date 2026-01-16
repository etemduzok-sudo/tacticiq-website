import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { 
  Target, Radio, Star, TrendingUp, BarChart3, Trophy, 
  Users, ShieldCheck, Zap, Brain 
} from 'lucide-react';

export function DesignShowcase() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Color Palette Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">TacticIQ Design System</h2>
          
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-semibold mb-6">Brand Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6">
                <div className="w-full h-32 rounded-lg mb-4" style={{ backgroundColor: '#0F2A24' }} />
                <h4 className="font-semibold mb-2">Primary</h4>
                <p className="text-sm text-muted-foreground font-mono">#0F2A24</p>
                <p className="text-sm text-muted-foreground mt-2">Deep forest green - Trust & professionalism</p>
              </Card>
              
              <Card className="p-6">
                <div className="w-full h-32 rounded-lg mb-4" style={{ backgroundColor: '#1FA2A6' }} />
                <h4 className="font-semibold mb-2">Secondary</h4>
                <p className="text-sm text-muted-foreground font-mono">#1FA2A6</p>
                <p className="text-sm text-muted-foreground mt-2">Teal - Energy & innovation</p>
              </Card>
              
              <Card className="p-6">
                <div className="w-full h-32 rounded-lg mb-4" style={{ backgroundColor: '#C9A44C' }} />
                <h4 className="font-semibold mb-2">Accent</h4>
                <p className="text-sm text-muted-foreground font-mono">#C9A44C</p>
                <p className="text-sm text-muted-foreground mt-2">Gold - Achievement & premium</p>
              </Card>
            </div>

            <h3 className="text-2xl font-semibold mb-6">Typography Showcase</h3>
            <Card className="p-8 mb-12 space-y-6">
              <div>
                <h1 className="text-4xl md:text-6xl font-bold mb-2">Heading 1</h1>
                <p className="text-sm text-muted-foreground">Used for hero titles and main headlines</p>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Heading 2</h2>
                <p className="text-sm text-muted-foreground">Used for section headers</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Heading 3</h3>
                <p className="text-sm text-muted-foreground">Used for subsections and card titles</p>
              </div>
              <div>
                <p className="text-base mb-2">Body Text - Regular paragraph text for content and descriptions.</p>
                <p className="text-sm text-muted-foreground">Muted text - Used for secondary information and captions.</p>
              </div>
            </Card>

            <h3 className="text-2xl font-semibold mb-6">Components</h3>
            
            {/* Buttons */}
            <Card className="p-8 mb-6">
              <h4 className="font-semibold mb-4">Buttons</h4>
              <div className="flex flex-wrap gap-4">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </Card>

            {/* Badges */}
            <Card className="p-8 mb-6">
              <h4 className="font-semibold mb-4">Badges</h4>
              <div className="flex flex-wrap gap-4">
                <Badge>Default Badge</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge className="gap-2">
                  <ShieldCheck className="size-4" />
                  Not Betting
                </Badge>
              </div>
            </Card>

            {/* Icons */}
            <Card className="p-8 mb-6">
              <h4 className="font-semibold mb-4">Feature Icons</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-lg bg-secondary/10 text-secondary">
                    <Target className="size-6" />
                  </div>
                  <span className="text-sm">Predictions</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-lg bg-accent/10 text-accent">
                    <Radio className="size-6" />
                  </div>
                  <span className="text-sm">Live Stats</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-lg bg-secondary/10 text-secondary">
                    <Star className="size-6" />
                  </div>
                  <span className="text-sm">Ratings</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-lg bg-accent/10 text-accent">
                    <TrendingUp className="size-6" />
                  </div>
                  <span className="text-sm">Progress</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-lg bg-secondary/10 text-secondary">
                    <Trophy className="size-6" />
                  </div>
                  <span className="text-sm">Achievements</span>
                </div>
              </div>
            </Card>

            {/* Cards */}
            <Card className="p-8 mb-6">
              <h4 className="font-semibold mb-4">Card Variants</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-2 border-border/50">
                  <BarChart3 className="size-8 text-secondary mb-3" />
                  <h5 className="font-semibold mb-2">Default Card</h5>
                  <p className="text-sm text-muted-foreground">Standard card with border</p>
                </Card>
                
                <Card className="p-6 border-2 border-secondary shadow-lg">
                  <Brain className="size-8 text-accent mb-3" />
                  <h5 className="font-semibold mb-2">Highlighted Card</h5>
                  <p className="text-sm text-muted-foreground">Featured with accent border</p>
                </Card>
                
                <Card className="p-6 bg-secondary/5 border-2 border-secondary/20">
                  <Zap className="size-8 text-secondary mb-3" />
                  <h5 className="font-semibold mb-2">Colored Background</h5>
                  <p className="text-sm text-muted-foreground">Subtle background tint</p>
                </Card>
              </div>
            </Card>

            {/* Visual Examples */}
            <h3 className="text-2xl font-semibold mb-6 mt-12">Visual Elements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1762744888286-c47377a6b760?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMHRhY3RpY3MlMjBzdGFkaXVtfGVufDF8fHx8MTc2ODMyNjgyMXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Football tactics"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h5 className="font-semibold mb-2">Tactical Analysis</h5>
                <p className="text-sm text-muted-foreground">Professional football analytics platform</p>
              </Card>

              <Card className="p-6">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1556056504-dc77ff4d11b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NjZXIlMjBhbmFseXRpY3MlMjBkYXRhfGVufDF8fHx8MTc2ODMyNjgyMnww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Soccer analytics"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h5 className="font-semibold mb-2">Data-Driven Insights</h5>
                <p className="text-sm text-muted-foreground">Advanced statistics and metrics</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Design Showcase */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-semibold mb-6">Responsive Design</h3>
            <Card className="p-8 mb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge>Mobile First</Badge>
                  <span className="text-sm text-muted-foreground">Optimized for all screen sizes</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-sm font-semibold mb-1">Mobile</p>
                    <p className="text-xs text-muted-foreground">&lt; 640px</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-sm font-semibold mb-1">Tablet</p>
                    <p className="text-xs text-muted-foreground">640px - 1024px</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-sm font-semibold mb-1">Desktop</p>
                    <p className="text-xs text-muted-foreground">1024px - 1536px</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-sm font-semibold mb-1">Wide</p>
                    <p className="text-xs text-muted-foreground">&gt; 1536px</p>
                  </div>
                </div>
              </div>
            </Card>

            <h3 className="text-2xl font-semibold mb-6 mt-12">Multilingual & RTL Support</h3>
            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <h5 className="font-semibold mb-3">8 Languages Supported</h5>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline">🇬🇧 English</Badge>
                    <Badge variant="outline">🇩🇪 Deutsch</Badge>
                    <Badge variant="outline">🇫🇷 Français</Badge>
                    <Badge variant="outline">🇪🇸 Español</Badge>
                    <Badge variant="outline">🇮🇹 Italiano</Badge>
                    <Badge variant="outline">🇹🇷 Türkçe</Badge>
                    <Badge variant="outline">🇸🇦 العربية</Badge>
                    <Badge variant="outline">🇨🇳 中文</Badge>
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">RTL Support</h5>
                  <p className="text-sm text-muted-foreground">Full right-to-left layout support for Arabic language</p>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">Theme Support</h5>
                  <div className="flex gap-3">
                    <Badge variant="secondary">☀️ Light Mode</Badge>
                    <Badge variant="secondary">🌙 Dark Mode</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Non-Gambling Emphasis */}
      <section className="py-16 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 border-2 border-secondary/20">
              <div className="flex flex-col items-center text-center space-y-4">
                <ShieldCheck className="size-16 text-secondary" />
                <h3 className="text-2xl font-bold">Not a Betting Platform</h3>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  TacticIQ is a skill-based football analysis game. No real money wagering, 
                  no odds, just pure tactical intelligence and strategic predictions.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 w-full">
                  <div className="p-4 bg-background rounded-lg">
                    <p className="font-semibold text-secondary mb-1">✓</p>
                    <p className="text-sm">Skill-Based</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <p className="font-semibold text-secondary mb-1">✓</p>
                    <p className="text-sm">No Betting</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <p className="font-semibold text-secondary mb-1">✓</p>
                    <p className="text-sm">Virtual Points</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <p className="font-semibold text-secondary mb-1">✓</p>
                    <p className="text-sm">Educational</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
