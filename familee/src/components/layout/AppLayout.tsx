import { Link, useLocation } from "wouter";
import { 
  Home, 
  Calendar, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  Megaphone, 
  Target, 
  Wallet, 
  ShoppingCart, 
  Wrench, 
  StickyNote, 
  Users, 
  Settings,
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, refetchUser } = useAppContext();
  const [location, setLocation] = useLocation();
  const logout = useLogout();
  const { toast } = useToast();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        refetchUser();
        setLocation("/login");
      },
      onError: () => {
        toast({ title: "Error logging out", variant: "destructive" });
      }
    });
  };

  const navItems = user?.mode === "parent" ? [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Chores", href: "/chores", icon: CheckSquare },
    { name: "Routines", href: "/routines", icon: Clock },
    { name: "School", href: "/school", icon: BookOpen },
    { name: "Announcements", href: "/announcements", icon: Megaphone },
    { name: "Goals", href: "/goals", icon: Target },
    { name: "Finances", href: "/finances", icon: Wallet },
    { name: "Groceries", href: "/groceries", icon: ShoppingCart },
    { name: "Maintenance", href: "/maintenance", icon: Wrench },
    { name: "Notes", href: "/notes", icon: StickyNote },
    { name: "Members", href: "/members", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ] : [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Chores", href: "/chores", icon: CheckSquare },
    { name: "School", href: "/school", icon: BookOpen },
    { name: "Routines", href: "/routines", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-sidebar border-b md:border-b-0 md:border-r border-border flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-serif font-bold text-primary flex items-center gap-2">
            Familee
            {user?.mode === "kids" && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full font-sans">Kids</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.familyName || "Your Family"}</p>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.username?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden h-[100dvh]">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
