import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

type SettingsFormState = {
  siteName: string;
  tagline: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  founderName: string;
  founderBio: string;
  founderPhotoUrl: string;
  socialInstagram: string;
  socialYoutube: string;
  socialFacebook: string;
  socialTiktok: string;
  studentCountLabel: string;
};

const EMPTY_FORM: SettingsFormState = {
  siteName: '',
  tagline: '',
  logoUrl: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  founderName: '',
  founderBio: '',
  founderPhotoUrl: '',
  socialInstagram: '',
  socialYoutube: '',
  socialFacebook: '',
  socialTiktok: '',
  studentCountLabel: '',
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsFormState>(EMPTY_FORM);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const settingsQuery = useGetSettings();

  useEffect(() => {
    if (settingsQuery.data) {
      const s = settingsQuery.data;
      setForm({
        siteName: s.siteName,
        tagline: s.tagline,
        logoUrl: s.logoUrl,
        contactEmail: s.contactEmail,
        contactPhone: s.contactPhone,
        address: s.address,
        founderName: s.founderName,
        founderBio: s.founderBio,
        founderPhotoUrl: s.founderPhotoUrl,
        socialInstagram: s.socialInstagram,
        socialYoutube: s.socialYoutube,
        socialFacebook: s.socialFacebook,
        socialTiktok: s.socialTiktok,
        studentCountLabel: s.studentCountLabel,
      });
    }
  }, [settingsQuery.data]);

  const updateMutation = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        toast({ title: 'Pengaturan berhasil disimpan' });
      },
      onError: (error) => {
        toast({
          title: 'Gagal menyimpan pengaturan',
          description: String((error as Error)?.message ?? error),
          variant: 'destructive',
        });
      },
    },
  });

  function updateField<K extends keyof SettingsFormState>(key: K, value: SettingsFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({ data: form });
  }

  if (settingsQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Memuat pengaturan...
        </div>
      </AdminLayout>
    );
  }

  if (settingsQuery.isError) {
    return (
      <AdminLayout>
        <div className="text-center text-sm text-destructive py-16">
          Gagal memuat pengaturan situs dari server.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Pengaturan Situs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola informasi umum, profil pendiri, dan tautan sosial media situs.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Umum</CardTitle>
            <CardDescription>Nama situs, tagline, dan informasi kontak.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Nama Situs</Label>
                <Input
                  id="site-name"
                  value={form.siteName}
                  onChange={(e) => updateField('siteName', e.target.value)}
                  data-testid="input-site-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-tagline">Tagline</Label>
                <Input
                  id="site-tagline"
                  value={form.tagline}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  data-testid="input-site-tagline"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-logo">URL Logo</Label>
              <Input
                id="site-logo"
                value={form.logoUrl}
                onChange={(e) => updateField('logoUrl', e.target.value)}
                data-testid="input-site-logo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email Kontak</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  data-testid="input-contact-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Nomor Telepon</Label>
                <Input
                  id="contact-phone"
                  value={form.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  data-testid="input-contact-phone"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-address">Alamat</Label>
              <Textarea
                id="site-address"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                rows={2}
                data-testid="input-site-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-count-label">Label Jumlah Santri</Label>
              <Input
                id="student-count-label"
                placeholder="cth: 1.200+ Santri Aktif"
                value={form.studentCountLabel}
                onChange={(e) => updateField('studentCountLabel', e.target.value)}
                data-testid="input-student-count-label"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil Pendiri</CardTitle>
            <CardDescription>Ditampilkan pada halaman tentang kami.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="founder-name">Nama Pendiri</Label>
              <Input
                id="founder-name"
                value={form.founderName}
                onChange={(e) => updateField('founderName', e.target.value)}
                data-testid="input-founder-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="founder-bio">Bio Pendiri</Label>
              <Textarea
                id="founder-bio"
                value={form.founderBio}
                onChange={(e) => updateField('founderBio', e.target.value)}
                rows={4}
                data-testid="input-founder-bio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="founder-photo">URL Foto Pendiri</Label>
              <Input
                id="founder-photo"
                value={form.founderPhotoUrl}
                onChange={(e) => updateField('founderPhotoUrl', e.target.value)}
                data-testid="input-founder-photo"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Media Sosial</CardTitle>
            <CardDescription>Tautan akun sosial media yang ditampilkan di footer situs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="social-instagram">Instagram</Label>
                <Input
                  id="social-instagram"
                  placeholder="https://instagram.com/..."
                  value={form.socialInstagram}
                  onChange={(e) => updateField('socialInstagram', e.target.value)}
                  data-testid="input-social-instagram"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social-youtube">YouTube</Label>
                <Input
                  id="social-youtube"
                  placeholder="https://youtube.com/..."
                  value={form.socialYoutube}
                  onChange={(e) => updateField('socialYoutube', e.target.value)}
                  data-testid="input-social-youtube"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social-facebook">Facebook</Label>
                <Input
                  id="social-facebook"
                  placeholder="https://facebook.com/..."
                  value={form.socialFacebook}
                  onChange={(e) => updateField('socialFacebook', e.target.value)}
                  data-testid="input-social-facebook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social-tiktok">TikTok</Label>
                <Input
                  id="social-tiktok"
                  placeholder="https://tiktok.com/@..."
                  value={form.socialTiktok}
                  onChange={(e) => updateField('socialTiktok', e.target.value)}
                  data-testid="input-social-tiktok"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-settings">
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Simpan
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
