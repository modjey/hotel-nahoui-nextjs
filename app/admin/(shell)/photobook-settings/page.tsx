"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Settings } from "lucide-react";

export default function PhotobookSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    allowDownloads: true,
    requireBookingForDownload: true,
    watermarkEnabled: false,
    watermarkText: "Hotel Nahoui",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/photobook-settings");
      const data = await response.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/photobook-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        alert("Paramètres sauvegardés avec succès !");
      } else {
        alert("Erreur lors de la sauvegarde: " + (data.error || "Erreur inconnue"));
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Paramètres du Photobook"
        description="Configurer les options de téléchargement et de partage"
      />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Téléchargements</CardTitle>
            <CardDescription>
              Configurez les règles de téléchargement des photos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autoriser les téléchargements</Label>
                <p className="text-sm text-muted-foreground">
                  Permettre aux utilisateurs de télécharger les photos
                </p>
              </div>
              <Switch
                checked={settings.allowDownloads}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowDownloads: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exiger un séjour</Label>
                <p className="text-sm text-muted-foreground">
                  Les utilisateurs doivent avoir séjourné à l'établissement pour télécharger
                </p>
              </div>
              <Switch
                checked={settings.requireBookingForDownload}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requireBookingForDownload: checked })
                }
                disabled={!settings.allowDownloads}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Watermark</CardTitle>
            <CardDescription>
              Configurez le watermark pour les images partagées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Activer le watermark</Label>
                <p className="text-sm text-muted-foreground">
                  Ajouter automatiquement un watermark aux images partagées
                </p>
              </div>
              <Switch
                checked={settings.watermarkEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, watermarkEnabled: checked })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Texte du watermark</Label>
              <Input
                value={settings.watermarkText}
                onChange={(e) =>
                  setSettings({ ...settings, watermarkText: e.target.value })
                }
                placeholder="Hotel Nahoui"
                disabled={!settings.watermarkEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Sauvegarde..." : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
