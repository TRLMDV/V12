import React, { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import supabase from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const Login: React.FC = () => {
  const { session, remember, setRemember } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>Use your email and password to access the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{ theme: ThemeSupa }}
            theme="light"
            localization={{
              variables: {
                sign_in: {
                  email_label: "Email",
                  password_label: "Password",
                  button_label: "Sign in",
                },
              },
            }}
          />
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
            <Label htmlFor="remember">Remember me</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            When “Remember me” is enabled, you stay signed in across browser restarts. Otherwise, the session lasts until you close the tab or browser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;