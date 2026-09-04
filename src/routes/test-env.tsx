import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/test-env')({
  component: TestEnv,
});

function TestEnv() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const cloudinaryName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Environment Variables Test</h1>
      
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-2 font-semibold text-lg">Supabase URL:</h2>
          <p className="font-mono text-sm break-all">
            {supabaseUrl || '❌ NOT LOADED'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Expected: https://cyewsomhrdfqhlzjfeka.supabase.co
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-2 font-semibold text-lg">Supabase Anon Key:</h2>
          <p className="font-mono text-sm break-all">
            {supabaseKey ? `${supabaseKey.substring(0, 50)}...` : '❌ NOT LOADED'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Expected: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-2 font-semibold text-lg">Cloudinary Cloud Name:</h2>
          <p className="font-mono text-sm">
            {cloudinaryName || '❌ NOT LOADED'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Expected: ajyqvfd8
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-2 font-semibold text-lg">Cloudinary Upload Preset:</h2>
          <p className="font-mono text-sm">
            {cloudinaryPreset || '❌ NOT LOADED'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Expected: 974253463599681
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-2 font-semibold text-lg">All Environment Variables:</h2>
          <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">
            {JSON.stringify(import.meta.env, null, 2)}
          </pre>
        </div>

        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-6">
          <h2 className="mb-2 font-semibold text-lg text-amber-700">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-amber-700">
            <li>If you see "❌ NOT LOADED" above, stop the dev server (Ctrl+C)</li>
            <li>Restart: <code className="bg-amber-500/20 px-1 rounded">npm run dev</code></li>
            <li>Hard refresh this page: Ctrl+Shift+R</li>
            <li>If still not loaded, check that .env file exists in project root</li>
            <li>Verify .env has no syntax errors (no quotes around values)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
