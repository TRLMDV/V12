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

const Login: React.FC = () => {
  const { session, remember, setRemember } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>Use your email and password to access the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={handleSignIn}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
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
                <Label htmlFor="remember">Remember me</Label>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground">
            Account creation is disabled. Contact an administrator to receive login credentials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;