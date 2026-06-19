"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/auth-store";
import { api, ApiError } from "@/lib/api";

const CATEGORIES = ["Beauty", "Fashion", "Fitness", "Food", "Tech", "Travel", "Family", "Finance"];
const LANGUAGES = ["English", "Arabic"];
const COUNTRIES = ["United Arab Emirates", "Saudi Arabia", "Egypt", "Qatar"];

interface FormValues {
  bio: string;
  country: string;
  city: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [languages, setLanguages] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { bio: "", country: COUNTRIES[0], city: "" },
  });

  useEffect(() => {
    if (!accessToken) router.replace("/login");
  }, [accessToken, router]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const onSubmit = async (values: FormValues) => {
    if (!accessToken) return;
    setServerError(null);
    setSubmitting(true);
    try {
      await api.updateProfile(accessToken, { ...values, languages, categories });
      router.push("/dashboard");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!accessToken) return null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <Badge variant="secondary" className="mb-2 w-fit">
            Step 1 of 1 · Quick setup
          </Badge>
          <CardTitle>Welcome, {user?.displayName ?? "there"} 👋</CardTitle>
          <CardDescription>
            A few details to personalize your {user?.role.toLowerCase()} experience. You can
            always edit this later from your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="bio">Short bio</Label>
              <Textarea id="bio" rows={3} placeholder="Tell us about yourself…" {...register("bio")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm dark:bg-input/30"
                  {...register("country")}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Dubai" {...register("city")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Languages</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <Badge
                    key={l}
                    variant={languages.includes(l) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5"
                    onClick={() => toggle(languages, setLanguages, l)}
                  >
                    {l}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Badge
                    key={c}
                    variant={categories.includes(c) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5"
                    onClick={() => toggle(categories, setCategories, c)}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <div className="flex items-center justify-between pt-2">
              <Link href="/dashboard" className="text-sm text-muted-foreground underline">
                Skip for now
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Finish setup"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
