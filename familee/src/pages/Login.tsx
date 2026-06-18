import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function Login() {
  const [username, setUsername] = useState("parent");
  const [password, setPassword] = useState("family123");
  const login = useLogin();
  const [, setLocation] = useLocation();
  const { refetchUser } = useAppContext();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { data: { username, password } },
      {
        onSuccess: () => {
          refetchUser();
          setLocation("/dashboard");
        },
        onError: () => {
          toast({
            title: "Login failed",
            description: "Please check your credentials and try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-sm z-10">
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl mx-auto flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
            <span className="font-serif text-3xl font-bold">F</span>
          </div>
          <CardTitle className="text-3xl font-serif mt-4">Welcome to Familee</CardTitle>
          <CardDescription className="text-base">
            Your family's digital home base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12 bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-background/50"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base shadow-md"
              disabled={login.isPending}
            >
              {login.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center pb-8 text-sm text-muted-foreground">
          Demo: parent / family123
        </CardFooter>
      </Card>
    </div>
  );
}
