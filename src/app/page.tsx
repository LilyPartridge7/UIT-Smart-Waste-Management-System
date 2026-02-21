import { AuthContainer } from '@/components/auth/auth-container';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background overflow-x-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,128,128,0.1),transparent)] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-block p-3 rounded-2xl bg-primary/10 mb-4 neon-border">
            <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
          <h1 className="text-4xl font-headline font-bold tracking-tight neon-glow">UIT Waste Watch</h1>
          <p className="text-muted-foreground">Smart Waste Management for UIT Campus</p>
        </div>

        <AuthContainer />
      </div>


    </main>
  );
}
