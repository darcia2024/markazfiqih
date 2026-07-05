import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

const DUMMY_CLASSES = [
  {
    id: 'f-101',
    title: 'Fiqih Thaharah Dasar',
    description: 'Memahami tata cara bersuci yang benar sesuai sunnah. Panduan esensial untuk kesempurnaan ibadah harian.',
    price: 'Rp 150.000',
    image: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 'f-102',
    title: 'Fiqih Shalat Kontemporer',
    description: 'Kajian mendalam tentang rukun, syarat, dan studi kasus shalat di era modern bagi pekerja dan musafir.',
    price: 'Rp 200.000',
    image: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 'f-201',
    title: 'Fiqih Muamalah Keuangan',
    description: 'Prinsip dasar ekonomi Islam, akad-akad jual beli, dan solusi keuangan terhindar dari riba.',
    price: 'Rp 250.000',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600&h=400'
  }
];

export default function CatalogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary/5 py-16 lg:py-24 border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center space-y-6">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary tracking-tight">
              Ilmu Fiqih, Tersusun Rapi
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Tingkatkan pemahaman agama Anda melalui kurikulum terstruktur. Dipandu oleh asatidzah kompeten dengan referensi kitab klasik dan kontemporer.
            </p>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="py-16 lg:py-24 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="mb-12 space-y-2">
            <h2 className="font-serif text-3xl font-bold text-foreground">Katalog Kelas</h2>
            <p className="text-muted-foreground">Pilih program belajar yang sesuai dengan jenjang Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {DUMMY_CLASSES.map((cls, idx) => (
              <motion.div 
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <Card className="h-full flex flex-col overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img 
                      src={cls.image} 
                      alt={cls.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">{cls.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed line-clamp-2">
                      {cls.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-end">
                    <p className="font-semibold text-lg text-primary">{cls.price}</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/class/${cls.id}`}>Lihat Detail</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
