import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminData } from '@/contexts/AdminDataContext';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ArrowRight, Clock, User, Folder } from 'lucide-react';

export function BlogSection() {
  const { t } = useLanguage();
  const { contents, sectionSettings } = useAdminData();

  // Admin panelinden section ayarları
  const blogSettings = sectionSettings.blog;

  // Sadece Blog tipinde ve "Yayında" olan içerikleri göster
  const publishedBlogs = contents
    .filter(content => content.type === 'Blog' && content.status === 'Yayında')
    .slice(0, blogSettings.maxPosts || 6); // Admin panelinden gelen limit

  // Fallback blog posts (eğer admin panelinde hiç blog yoksa)
  const fallbackPosts = [
    {
      id: '1',
      title: t('blog.posts.post1.title'),
      description: t('blog.posts.post1.desc'),
      category: t('blog.posts.post1.category'),
      date: t('blog.posts.post1.date'),
      author: 'TacticIQ Team',
      readTime: '5',
    },
    {
      id: '2',
      title: t('blog.posts.post2.title'),
      description: t('blog.posts.post2.desc'),
      category: t('blog.posts.post2.category'),
      date: t('blog.posts.post2.date'),
      author: 'TacticIQ Team',
      readTime: '7',
    },
    {
      id: '3',
      title: t('blog.posts.post3.title'),
      description: t('blog.posts.post3.desc'),
      category: t('blog.posts.post3.category'),
      date: t('blog.posts.post3.date'),
      author: 'TacticIQ Team',
      readTime: '6',
    },
  ];

  // Admin bloglarını veya fallback'leri kullan
  const displayPosts = publishedBlogs.length > 0 
    ? publishedBlogs.map(blog => ({
        id: blog.id,
        title: blog.title,
        description: blog.title, // Blog detayları admin panelinde eklenmemiş, sadece başlık var
        category: blog.type,
        date: new Date(blog.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        author: blog.author.split('@')[0], // Email'den isim çıkar
        readTime: '5',
      }))
    : fallbackPosts;

  // SEO: Structured data for blog articles
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": displayPosts.map((post, index) => ({
      "@type": "Article",
      "position": index + 1,
      "headline": post.title,
      "description": post.description,
      "datePublished": post.date,
      "author": {
        "@type": "Organization",
        "name": post.author
      },
      "image": displayPosts.map((_, i) => {
        const blogImages = [
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
          'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
          'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80',
        ];
        return blogImages[i % blogImages.length];
      })[index]
    }))
  };

  return (
    <section id="blog" className="py-20 md:py-28 bg-muted/20" itemScope itemType="https://schema.org/Blog">
      {/* SEO: Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('blog.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('blog.subtitle')}
          </p>
        </div>

        {/* Blog Grid - Scrollable */}
        <div className="overflow-x-auto pb-4 mb-12 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-6 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 min-w-max md:min-w-0">
            {displayPosts.map((post, index) => {
            // Stok fotoğraflar - Unsplash (futbol/analiz temalı)
            const blogImages = [
              'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80', // Futbol sahası
              'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80', // Futbol topu
              'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80', // Stadyum
              'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&q=80', // Futbol oyuncusu
              'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80', // Taktik tahtası
              'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80', // Futbol sahası geniş açı
            ];
            const imageUrl = blogImages[index % blogImages.length];
            
            return (
            <article key={post.id} itemScope itemType="https://schema.org/Article">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden min-w-[300px] md:min-w-0 h-full">
              {/* Blog Image */}
              <div className="h-48 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 relative overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="inline-block px-3 py-1 bg-secondary text-white text-xs font-semibold rounded-full backdrop-blur-sm">
                    {post.category}
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {post.readTime} {t('blog.readTime')}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="size-3" />
                    {post.author}
                  </div>
                </div>

                {/* Title - SEO optimized */}
                <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-secondary transition-colors" itemProp="headline">
                  {post.title}
                </h3>

                {/* Description - SEO friendly with proper semantic HTML */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3" itemProp="description">
                  {post.description}
                </p>
                {/* Hidden structured data for SEO */}
                <time itemProp="datePublished" dateTime={post.date} className="hidden">{post.date}</time>
                <span itemProp="author" itemScope itemType="https://schema.org/Organization" className="hidden">
                  <span itemProp="name">{post.author}</span>
                </span>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <time className="text-xs text-muted-foreground" dateTime={post.date}>{post.date}</time>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 group-hover:gap-3 transition-all"
                    onClick={() => {
                      // Blog detay sayfasına yönlendirme veya modal açma
                      // Şimdilik blog bölümüne scroll yap
                      const blogSection = document.getElementById('blog');
                      if (blogSection) {
                        blogSection.scrollIntoView({ behavior: 'smooth' });
                      }
                      // TODO: Blog detay sayfası eklendiğinde buraya navigate ekle
                      // navigate(`/blog/${post.id}`);
                    }}
                  >
                    {t('blog.readMore')}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            </article>
          );
            })}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button 
            size="lg" 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              // Tüm blog sayfasına yönlendirme
              // Şimdilik blog bölümünde scroll yap ve tüm makaleleri göster
              const blogSection = document.getElementById('blog');
              if (blogSection) {
                blogSection.scrollIntoView({ behavior: 'smooth' });
              }
              // TODO: Blog list sayfası eklendiğinde buraya navigate ekle
              // navigate('/blog');
            }}
          >
            {t('blog.viewAll')}
            <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}