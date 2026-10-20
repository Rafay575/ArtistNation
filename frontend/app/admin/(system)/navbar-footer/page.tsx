"use client";

import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useWebsite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadField } from "@/components/ImageUploadField";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Palette,
  Image as ImageIcon,
  Link2,
  Layers,
  Share2,
  Mail,
  Save,
} from "lucide-react";

interface NavLink {
  label: string;
  href: string;
  type: "page" | "anchor" | "external";
}

const defaultNavLinks: NavLink[] = [
  { label: "Home", href: "/", type: "page" },
];

export default function NavbarFooterPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [form, setForm] = useState({
    siteName: "",
    primaryColor: "#5D2FDB",
    logoUrl: "",
    logoUrlLight: "",
    logoUrlDark: "",
    faviconUrl: "",
    navLinks: [] as NavLink[],
    footerData: {
      contact: "",
      socials: [] as { platform: string; url: string }[],
      subscribeText: "",
      subscribeEnabled: true,
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        siteName: settings.site_name || "",
        primaryColor: settings.primary_color || "#5D2FDB",
        logoUrl: settings.logo_url || "",
        logoUrlLight: settings.logo_url_light || "",
        logoUrlDark: settings.logo_url_dark || "",
        faviconUrl: settings.favicon_url || "",
        navLinks: settings.nav_links?.length ? settings.nav_links : defaultNavLinks,
        footerData: {
          contact: settings.footer_data?.contact || "",
          socials: settings.footer_data?.socials || [],
          subscribeText: settings.footer_data?.subscribeText || "",
          subscribeEnabled: settings.footer_data?.subscribeEnabled !== false,
        },
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleFooterChange = (key: string, value: any) => {
    setForm({
      ...form,
      footerData: { ...form.footerData, [key]: value },
    });
  };

  const handleSocialChange = (index: number, field: string, value: string) => {
    const newSocials = [...form.footerData.socials];
    newSocials[index] = { ...newSocials[index], [field]: value };
    setForm({ ...form, footerData: { ...form.footerData, socials: newSocials } });
  };

  const addSocial = () => {
    setForm({
      ...form,
      footerData: {
        ...form.footerData,
        socials: [...form.footerData.socials, { platform: "", url: "" }],
      },
    });
  };

  const removeSocial = (index: number) => {
    const newSocials = form.footerData.socials.filter((_, i) => i !== index);
    setForm({ ...form, footerData: { ...form.footerData, socials: newSocials } });
  };

  // NavLinks handlers
  const addNavLink = () => {
    setForm({
      ...form,
      navLinks: [...form.navLinks, { label: "", href: "", type: "page" }],
    });
  };

  const removeNavLink = (index: number) => {
    setForm({ ...form, navLinks: form.navLinks.filter((_, i) => i !== index) });
  };

  const updateNavLink = (index: number, field: keyof NavLink, value: string) => {
    const newLinks = [...form.navLinks];
    (newLinks[index] as any)[field] = value;
    setForm({ ...form, navLinks: newLinks });
  };

  const handleSave = () => {
    const payload = {
      siteName: form.siteName,
      primaryColor: form.primaryColor,
      logoUrl: form.logoUrl,
      logoUrlLight: form.logoUrlLight,
      logoUrlDark: form.logoUrlDark,
      faviconUrl: form.faviconUrl,
      navLinks: form.navLinks,
      footerData: form.footerData,
    };
    updateSettings.mutate(payload, {
      onSuccess: () => toast.success("Settings updated"),
      onError: () => toast.error("Failed to update settings"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Customize how your site's header and footer look and behave.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="gap-2 shadow-sm"
          size="lg"
        >
          {updateSettings.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="navbar" className="space-y-6">
        <TabsList className="bg-gray-100/80 p-1 rounded-lg">
          <TabsTrigger
            value="navbar"
            className="rounded-md data-[state=active]:shadow-sm data-[state=active]:bg-white"
          >
            Navbar
          </TabsTrigger>
          <TabsTrigger
            value="footer"
            className="rounded-md data-[state=active]:shadow-sm data-[state=active]:bg-white"
          >
            Footer
          </TabsTrigger>
        </TabsList>

        {/* ---------- Navbar Tab ---------- */}
        <TabsContent value="navbar" className="space-y-6">
          {/* Basic info */}
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Brand basics</CardTitle>
                  <CardDescription>Your site name and accent color</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="siteName">Site name</Label>
                  <Input
                    id="siteName"
                    value={form.siteName}
                    onChange={handleChange}
                    placeholder="Acme Barbershop"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="primaryColor">Primary color</Label>
                  <div className="flex gap-3 items-center h-9">
                    <div className="relative">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={form.primaryColor}
                        onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                        className="w-10 h-10 p-1 cursor-pointer rounded-lg border-gray-200"
                      />
                    </div>
                    <span className="text-sm font-mono text-muted-foreground bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-200">
                      {form.primaryColor}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logos */}
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Logos</CardTitle>
                  <CardDescription>Used across your navbar and footer</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ImageUploadField
                value={form.logoUrl}
                onChange={(url) => setForm({ ...form, logoUrl: url })}
                label="Navbar logo"
              />
              {/*
              <ImageUploadField
                value={form.logoUrlLight}
                onChange={(url) => setForm({ ...form, logoUrlLight: url })}
                label="Light Logo (for transparent/dark header)"
              />
              */}
              <ImageUploadField
                value={form.logoUrlDark}
                onChange={(url) => setForm({ ...form, logoUrlDark: url })}
                label="Footer logo"
              />
              {/*
              <ImageUploadField
                value={form.faviconUrl}
                onChange={(url) => setForm({ ...form, faviconUrl: url })}
                label="Favicon URL"
              />
              */}
            </CardContent>
          </Card>

          {/* Navigation Links */}
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Navigation links</CardTitle>
                    <CardDescription>Shown in your site's header menu</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={addNavLink} className="gap-1.5">
                  <Plus className="w-4 h-4" /> Add link
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {form.navLinks.length === 0 && (
                <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
                  <Layers className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No links yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add a link so visitors can navigate your site
                  </p>
                </div>
              )}
              <div className="space-y-2.5">
                {form.navLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="group flex flex-col sm:flex-row gap-2.5 items-start sm:items-center bg-gray-50/70 hover:bg-gray-50 border border-gray-100 p-3 rounded-xl transition-colors"
                  >
                    <GripVertical className="hidden sm:block w-4 h-4 text-gray-300 shrink-0 cursor-grab" />
                    <div className="flex-1 flex flex-col sm:flex-row gap-2.5 w-full">
                      <Input
                        placeholder="Label"
                        value={link.label}
                        onChange={(e) => updateNavLink(idx, "label", e.target.value)}
                        className="flex-1 bg-white"
                      />
                      <Input
                        placeholder="URL or /slug"
                        value={link.href}
                        onChange={(e) => updateNavLink(idx, "href", e.target.value)}
                        className="flex-1 bg-white"
                      />
                      <Select
                        value={link.type}
                        onValueChange={(val) => updateNavLink(idx, "type", val)}
                      >
                        <SelectTrigger className="w-full sm:w-[130px] bg-white">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="page">Page</SelectItem>
                          <SelectItem value="anchor">Anchor</SelectItem>
                          <SelectItem value="external">External</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeNavLink(idx)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Footer Tab ---------- */}
        <TabsContent value="footer" className="space-y-6">
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Contact</CardTitle>
                  <CardDescription>Displayed in the footer, HTML allowed</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                id="footerContact"
                value={form.footerData.contact}
                onChange={(e) => handleFooterChange("contact", e.target.value)}
                rows={4}
                placeholder="0665 Broadway NY, New York 10001&#10;<b>855 100 4444</b>&#10;info@barber.com"
                className="resize-none bg-gray-50/50"
              />
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Social links</CardTitle>
                  <CardDescription>Icons shown in your footer</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {form.footerData.socials.length === 0 && (
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm text-muted-foreground">No social links yet</p>
                </div>
              )}
              {form.footerData.socials.map((social, idx) => (
                <div
                  key={idx}
                  className="flex gap-2.5 items-center bg-gray-50/70 border border-gray-100 p-2.5 rounded-xl"
                >
                  <Input
                    placeholder="Platform (facebook, instagram, x, etc.)"
                    value={social.platform}
                    onChange={(e) => handleSocialChange(idx, "platform", e.target.value)}
                    className="flex-1 bg-white"
                  />
                  <Input
                    placeholder="URL"
                    value={social.url}
                    onChange={(e) => handleSocialChange(idx, "url", e.target.value)}
                    className="flex-1 bg-white"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSocial(idx)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addSocial} className="gap-1.5 mt-1">
                <Plus className="w-4 h-4" /> Add social link
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Subscribe section</CardTitle>
                  <CardDescription>Newsletter signup in your footer</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="subscribeText">Heading</Label>
                <Input
                  id="subscribeText"
                  value={form.footerData.subscribeText}
                  onChange={(e) => handleFooterChange("subscribeText", e.target.value)}
                  placeholder="Subscribe & follow"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
                <div>
                  <Label htmlFor="subscribeEnabled" className="cursor-pointer">
                    Show subscribe section
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Toggle the newsletter form on or off site-wide
                  </p>
                </div>
                <Switch
                  id="subscribeEnabled"
                  checked={form.footerData.subscribeEnabled}
                  onCheckedChange={(val) => handleFooterChange("subscribeEnabled", val)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}