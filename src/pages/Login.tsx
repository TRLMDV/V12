import React, { useEffect, useState } from "react";
import supabase from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { t, setLanguage, getLanguage, addNamespaceTranslations } from "@/utils/i18n";

// Register login namespace translations (English & Russian)
addNamespaceTranslations("en", "login", {
  signInTitle: "Sign in",
  signInDescription: "Use your email and password to access the app.",
  email: "Email",
  password: "Password",
  signInButton: "Sign in",
  rememberMe: "Remember me",
  accountCreationDisabled: "Account creation is disabled. Contact an administrator to receive login credentials.",
  requiredFieldsError: "Please enter email and password.",
  english: "English",
  russian: "Russian",
});
addNamespaceTranslations("ru", "login", {
  signInTitle: "Войти",
  signInDescription: "Введите email и пароль, чтобы получить доступ к приложению.",
  email: "Эл. почта",
  password: "Пароль",
  signInButton: "Войти",
  rememberMe: "Запомнить меня",
  accountCreationDisabled: "Создание аккаунта отключено. Обратитесь к администратору для получения данных для входа.",
  requiredFieldsError: "Введите email и пароль.",
  english: "Английский",
  russian: "Русский",
});

const Login: React.FC = () => {
  const { session, remember, setRemember } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [lang, setLang] = useState<string>(getLanguage());

  useEffect(() => {
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  function switchLanguage(next: "en" | "ru") {
    setLanguage(next);
    setLang(next);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t("login.requiredFieldsError"));
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("login.signInButton"));
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 p-4 relative">
      {/* Top-right language selector */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          variant={lang === "en" ? "default" : "ghost"}
          size="sm"
          onClick={() => switchLanguage("en")}
        >
          {t("login.english")}
        </Button>
        <Button
          variant={lang === "ru" ? "default" : "ghost"}
          size="sm"
          onClick={() => switchLanguage("ru")}
        >
          {t("login.russian")}
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">{t("login.signInTitle")}</CardTitle>
          <CardDescription>{t("login.signInDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Custom Sign In form without Sign Up */}
          <form className="space-y-3" onSubmit={handleSignIn}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
                <Label htmlFor="remember">{t("login.rememberMe")}</Label>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? `${t("login.signInButton")}...` : t("login.signInButton")}
              </Button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground">
            {t("login.accountCreationDisabled")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;