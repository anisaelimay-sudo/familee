import { useGetParentDashboard, useGetKidsDashboard } from "@workspace/api-client-react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckSquare, ShoppingCart, AlertCircle, Megaphone, BookOpen, Target } from "lucide-react";
import { Link } from "wouter";

export function Dashboard() {
  const { user } = useAppContext();
  if (user?.mode === "kids") return <KidsDashboard />;
  return <ParentDashboard />;
}

function ParentDashboard() {
  const { data: dashboard, isLoading } = useGetParentDashboard({
    query: { queryKey: ["parentDashboard"] }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded-xl w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const d = dashboard as any;
  const pendingCount = d?.pendingChores?.length ?? 0;
  const upcomingCount = d?.upcomingEvents?.length ?? 0;
  const groceryCount = d?.groceryCount ?? 0;
  const maintenanceCount = d?.maintenanceAlerts?.length ?? 0;

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Family Command Center</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening for your family.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/chores">
          <Card className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Pending Chores</p>
                <CheckSquare className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary">{pendingCount}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/calendar">
          <Card className="bg-secondary/10 border-secondary/20 hover:bg-secondary/20 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">Events</p>
                <Calendar className="w-4 h-4 text-secondary-foreground" />
              </div>
              <p className="text-3xl font-bold text-secondary-foreground">{upcomingCount}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/groceries">
          <Card className="bg-green-500/5 border-green-500/20 hover:bg-green-500/10 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Groceries</p>
                <ShoppingCart className="w-4 h-4 text-green-700" />
              </div>
              <p className="text-3xl font-bold text-green-700">{groceryCount}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/maintenance">
          <Card className={`${maintenanceCount > 0 ? "bg-destructive/5 border-destructive/20 hover:bg-destructive/10" : "bg-muted/50 border-border"} transition-colors cursor-pointer`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-semibold uppercase tracking-wider ${maintenanceCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>Maintenance</p>
                <AlertCircle className={`w-4 h-4 ${maintenanceCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              </div>
              <p className={`text-3xl font-bold ${maintenanceCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>{maintenanceCount}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d?.upcomingEvents?.length > 0 ? (
              <div className="space-y-3">
                {d.upcomingEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors border">
                    <div className="w-2.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: event.color || "var(--color-primary)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.startDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {event.memberName && ` · ${event.memberName}`}
                      </p>
                    </div>
                    {event.category && <Badge variant="outline" className="text-xs hidden sm:flex">{event.category}</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed rounded-xl">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">No upcoming events this week</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-secondary-foreground" /> Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {d?.recentAnnouncements?.length > 0 ? (
                <div className="space-y-3">
                  {d.recentAnnouncements.map((ann: any) => (
                    <div key={ann.id} className="bg-secondary/10 p-3 rounded-xl border border-secondary/20">
                      {ann.pinned && <span className="text-xs text-secondary font-semibold">📌 Pinned · </span>}
                      <p className="font-medium text-sm">{ann.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{ann.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4 border border-dashed rounded-xl">No new announcements</p>
              )}
            </CardContent>
          </Card>

          {/* Pending Chores Preview */}
          {d?.pendingChores?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" /> Pending Chores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {d.pendingChores.slice(0, 4).map((chore: any) => (
                    <div key={chore.id} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary/40 flex-shrink-0" />
                      <span className="flex-1 truncate">{chore.title}</span>
                      {chore.assignedName && <span className="text-xs text-muted-foreground">{chore.assignedName}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function KidsDashboard() {
  const { user } = useAppContext();
  const { data: dashboard, isLoading } = useGetKidsDashboard({
    query: { queryKey: ["kidsDashboard"] }
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-32 bg-muted rounded-2xl" /><div className="h-64 bg-muted rounded-2xl" /></div>;
  }

  const d = dashboard as any;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <header className="text-center pt-6">
        <h1 className="text-4xl font-serif font-bold text-primary mb-1">Hi there! 👋</h1>
        <p className="text-lg text-muted-foreground">Here's your day at a glance.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* My Chores */}
        <Card className="border-4 border-primary/20 rounded-2xl overflow-hidden">
          <div className="bg-primary/10 p-4 border-b-4 border-primary/20">
            <CardTitle className="text-xl font-serif text-primary flex items-center gap-2">
              <CheckSquare className="w-5 h-5" /> My Chores
            </CardTitle>
          </div>
          <CardContent className="p-4">
            {d?.myChores?.length > 0 ? (
              <div className="space-y-2">
                {d.myChores.map((chore: any) => (
                  <div key={chore.id} className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border-2 border-transparent hover:border-primary/20 transition-all">
                    <div className="w-5 h-5 rounded-full border-2 border-primary flex-shrink-0" />
                    <span className="font-medium">{chore.title}</span>
                    {chore.points > 0 && <span className="ml-auto text-sm text-secondary-foreground font-bold">⭐ {chore.points}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="text-4xl block mb-2">🎉</span>
                <p className="font-medium text-muted-foreground">All done!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Events */}
        <Card className="border-4 border-secondary/30 rounded-2xl overflow-hidden">
          <div className="bg-secondary/15 p-4 border-b-4 border-secondary/30">
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Today
            </CardTitle>
          </div>
          <CardContent className="p-4">
            {d?.todayEvents?.length > 0 ? (
              <div className="space-y-2">
                {d.todayEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-secondary/10 rounded-xl">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: event.color || "#f59e0b" }} />
                    <span className="font-medium">{event.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="text-4xl block mb-2">🌟</span>
                <p className="font-medium text-muted-foreground">Free day!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* School */}
        {d?.mySchoolItems?.length > 0 && (
          <Card className="border-4 border-blue-200 rounded-2xl overflow-hidden">
            <div className="bg-blue-50 p-4 border-b-4 border-blue-200">
              <CardTitle className="text-xl font-serif text-blue-700 flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> School
              </CardTitle>
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                {d.mySchoolItems.slice(0, 4).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl">
                    <div className="text-sm w-5 text-center">📝</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">Due {item.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goals */}
        {d?.familyGoals?.length > 0 && (
          <Card className="border-4 border-green-200 rounded-2xl overflow-hidden">
            <div className="bg-green-50 p-4 border-b-4 border-green-200">
              <CardTitle className="text-xl font-serif text-green-700 flex items-center gap-2">
                <Target className="w-5 h-5" /> Family Goals
              </CardTitle>
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                {d.familyGoals.slice(0, 3).map((goal: any) => {
                  const pct = Math.min(100, Math.round((goal.progress / goal.target) * 100));
                  return (
                    <div key={goal.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate">{goal.title}</span>
                        <span className="text-green-700 font-bold ml-2">{pct}%</span>
                      </div>
                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Announcements */}
      {d?.announcements?.length > 0 && (
        <div>
          <h2 className="font-serif text-xl font-bold mb-3 flex items-center gap-2">
            <Megaphone className="w-5 h-5" /> Family News
          </h2>
          <div className="space-y-3">
            {d.announcements.map((ann: any) => (
              <Card key={ann.id} className="border-2 border-secondary/30 bg-secondary/5 rounded-2xl">
                <CardContent className="p-4">
                  <p className="font-semibold">{ann.title}</p>
                  <p className="text-muted-foreground mt-1">{ann.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
