import { useState } from "react";
import { useSwitchMode } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Shield, Users, Moon, Sun, Lock } from "lucide-react";

export function Settings() {
  const { user, refetchUser } = useAppContext();
  const switchMode = useSwitchMode();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [parentPassword, setParentPassword] = useState("");
  const [switchingToParent, setSwitchingToParent] = useState(false);

  const handleSwitchToParent = () => {
    switchMode.mutate({ data: { mode: "parent", password: parentPassword } as any }, {
      onSuccess: () => {
        refetchUser();
        setParentPassword("");
        setSwitchingToParent(false);
        toast({ title: "Switched to Parent Mode" });
      },
      onError: () => {
        toast({ title: "Incorrect password", variant: "destructive" });
      }
    });
  };

  const handleSwitchToKids = () => {
    switchMode.mutate({ data: { mode: "kids" } as any }, {
      onSuccess: () => {
        refetchUser();
        setLocation("/dashboard");
        toast({ title: "Switched to Kids Mode" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-3xl font-serif font-bold">Settings</h1>
        <p className="text-muted-foreground">App preferences and mode switching</p>
      </header>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Current Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant={user?.mode === "parent" ? "default" : "secondary"} className="text-sm px-3 py-1">
              {user?.mode === "parent" ? "🔐 Parent Mode" : "👧 Kids Mode"}
            </Badge>
            <span className="text-muted-foreground text-sm">Logged in as {user?.username}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {user?.mode === "parent"
              ? "You have full access to all features including private notes, finances, and settings."
              : "Kids Mode shows a simplified, age-appropriate view of the app."}
          </p>
        </CardContent>
      </Card>

      {/* Mode Switching */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Switch Mode
          </CardTitle>
          <CardDescription>Switch between Parent Mode and Kids Mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.mode === "parent" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Switch to Kids Mode to see what your kids see.</p>
              <Button variant="outline" onClick={handleSwitchToKids} disabled={switchMode.isPending}>
                <Moon className="h-4 w-4 mr-2" /> Switch to Kids Mode
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {!switchingToParent ? (
                <>
                  <p className="text-sm text-muted-foreground">Switch to Parent Mode to access all features.</p>
                  <Button onClick={() => setSwitchingToParent(true)}>
                    <Lock className="h-4 w-4 mr-2" /> Switch to Parent Mode
                  </Button>
                </>
              ) : (
                <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                  <Label>Enter Parent Password</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={parentPassword}
                      onChange={e => setParentPassword(e.target.value)}
                      placeholder="Parent password"
                      onKeyDown={e => e.key === "Enter" && handleSwitchToParent()}
                      autoFocus
                    />
                    <Button onClick={handleSwitchToParent} disabled={switchMode.isPending || !parentPassword}>Unlock</Button>
                    <Button variant="ghost" onClick={() => { setSwitchingToParent(false); setParentPassword(""); }}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">About Familee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Version 1.0.0</p>
          <p>A premium household management app for the whole family.</p>
          <Separator className="my-3" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Demo Credentials</p>
            <p>Username: <code className="bg-muted px-1 py-0.5 rounded">parent</code></p>
            <p>Password: <code className="bg-muted px-1 py-0.5 rounded">family123</code></p>
            <p>Parent Mode Password: <code className="bg-muted px-1 py-0.5 rounded">family123</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
