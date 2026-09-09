import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, XCircle, Database, User, Key } from 'lucide-react';

export const Route = createFileRoute('/admin/debug')({
  component: AdminDebug,
});

function AdminDebug() {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // Test 1: Environment Variables
    diagnostics.tests.envVars = {
      name: 'Environment Variables',
      status: 'checking',
      details: {},
    };
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      diagnostics.tests.envVars.details = {
        VITE_SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
        VITE_SUPABASE_ANON_KEY: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING',
        allEnvKeys: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')),
      };
      
      if (supabaseUrl && supabaseKey) {
        diagnostics.tests.envVars.status = 'pass';
      } else {
        diagnostics.tests.envVars.status = 'fail';
        diagnostics.tests.envVars.error = 'Missing Supabase environment variables';
      }
    } catch (error: any) {
      diagnostics.tests.envVars.status = 'fail';
      diagnostics.tests.envVars.error = error.message;
    }

    // Test 2: Supabase Connection
    diagnostics.tests.supabaseConnection = {
      name: 'Supabase Connection',
      status: 'checking',
    };
    
    try {
      const { data, error } = await supabase.from('admin_users').select('count').limit(1);
      
      if (error) {
        diagnostics.tests.supabaseConnection.status = 'fail';
        diagnostics.tests.supabaseConnection.error = error.message;
        diagnostics.tests.supabaseConnection.code = error.code;
      } else {
        diagnostics.tests.supabaseConnection.status = 'pass';
        diagnostics.tests.supabaseConnection.message = 'Successfully connected to Supabase';
      }
    } catch (error: any) {
      diagnostics.tests.supabaseConnection.status = 'fail';
      diagnostics.tests.supabaseConnection.error = error.message;
    }

    // Test 3: Check Tables Exist
    diagnostics.tests.tablesExist = {
      name: 'Database Tables',
      status: 'checking',
      tables: {},
    };
    
    const tables = ['admin_users', 'content_blocks', 'submissions', 'audit_log', 'rate_limit_log'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        
        if (error) {
          diagnostics.tests.tablesExist.tables[table] = {
            exists: false,
            error: error.message,
            code: error.code,
          };
        } else {
          diagnostics.tests.tablesExist.tables[table] = {
            exists: true,
          };
        }
      } catch (error: any) {
        diagnostics.tests.tablesExist.tables[table] = {
          exists: false,
          error: error.message,
        };
      }
    }
    
    const allTablesExist = Object.values(diagnostics.tests.tablesExist.tables).every((t: any) => t.exists);
    diagnostics.tests.tablesExist.status = allTablesExist ? 'pass' : 'fail';

    // Test 4: Check Admin Users
    diagnostics.tests.adminUsers = {
      name: 'Admin Users in Database',
      status: 'checking',
    };
    
    try {
      const { data, error, count } = await supabase
        .from('admin_users')
        .select('user_id, role, added_at', { count: 'exact' });
      
      if (error) {
        diagnostics.tests.adminUsers.status = 'fail';
        diagnostics.tests.adminUsers.error = error.message;
        diagnostics.tests.adminUsers.code = error.code;
      } else {
        diagnostics.tests.adminUsers.status = 'pass';
        diagnostics.tests.adminUsers.count = count;
        diagnostics.tests.adminUsers.users = data?.map((u: any) => ({
          user_id: u.user_id,
          role: u.role,
          added_at: u.added_at,
        }));
      }
    } catch (error: any) {
      diagnostics.tests.adminUsers.status = 'fail';
      diagnostics.tests.adminUsers.error = error.message;
    }

    // Test 5: Check Auth Users
    diagnostics.tests.authUsers = {
      name: 'Supabase Auth Users',
      status: 'checking',
    };
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      diagnostics.tests.authUsers.currentUser = user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      } : null;
      
      if (error) {
        diagnostics.tests.authUsers.error = error.message;
      }
      
      diagnostics.tests.authUsers.status = 'pass';
    } catch (error: any) {
      diagnostics.tests.authUsers.status = 'fail';
      diagnostics.tests.authUsers.error = error.message;
    }

    // Test 6: Test Authentication
    diagnostics.tests.testAuth = {
      name: 'Test Authentication (requires credentials)',
      status: 'skipped',
      message: 'Use the form below to test specific credentials',
    };

    setResults(diagnostics);
    setIsLoading(false);
  };

  const testLogin = async (email: string, password: string) => {
    setIsLoading(true);
    const loginTest: any = {
      timestamp: new Date().toISOString(),
      email,
    };

    try {
      // Step 1: Attempt auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      loginTest.authStep = {
        success: !authError,
        error: authError?.message,
        user: authData.user ? {
          id: authData.user.id,
          email: authData.user.email,
        } : null,
      };

      if (authError) {
        loginTest.status = 'auth_failed';
        setResults({ ...results, loginTest });
        setIsLoading(false);
        return;
      }

      // Step 2: Check admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authData.user!.id)
        .single();

      loginTest.adminCheck = {
        success: !adminError,
        error: adminError?.message,
        code: adminError?.code,
        admin: adminData,
      };

      if (adminError) {
        if (adminError.code === 'PGRST116') {
          loginTest.status = 'not_admin';
          loginTest.message = 'User authenticated but not in admin_users table';
        } else {
          loginTest.status = 'database_error';
          loginTest.message = 'Database error checking admin status';
        }
      } else {
        loginTest.status = 'success';
        loginTest.message = 'Login successful!';
      }

      // Sign out after test
      await supabase.auth.signOut();

    } catch (error: any) {
      loginTest.status = 'error';
      loginTest.error = error.message;
    }

    setResults({ ...results, loginTest });
    setIsLoading(false);
  };

  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Admin Database Diagnostics</h1>
          <p className="mt-2 text-muted-foreground">
            Test database connection and admin authentication
          </p>
        </div>

        {/* Run Diagnostics Button */}
        <div className="mb-8">
          <button
            onClick={runDiagnostics}
            disabled={isLoading}
            className="rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Running Tests...' : 'Run Database Diagnostics'}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            {Object.entries(results.tests || {}).map(([key, test]: [string, any]) => (
              <div
                key={key}
                className="rounded-lg border border-border bg-card p-6 shadow-card"
              >
                <div className="flex items-start gap-3">
                  {test.status === 'pass' && (
                    <CheckCircle className="h-6 w-6 shrink-0 text-green-500" />
                  )}
                  {test.status === 'fail' && (
                    <XCircle className="h-6 w-6 shrink-0 text-red-500" />
                  )}
                  {test.status === 'checking' && (
                    <AlertCircle className="h-6 w-6 shrink-0 text-yellow-500" />
                  )}
                  {test.status === 'skipped' && (
                    <AlertCircle className="h-6 w-6 shrink-0 text-gray-500" />
                  )}

                  <div className="flex-1">
                    <h3 className="font-bold text-primary">{test.name}</h3>
                    {test.error && (
                      <p className="mt-2 text-sm text-red-500">Error: {test.error}</p>
                    )}
                    {test.code && (
                      <p className="mt-1 text-sm text-muted-foreground">Code: {test.code}</p>
                    )}
                    {test.message && (
                      <p className="mt-2 text-sm text-muted-foreground">{test.message}</p>
                    )}
                    {test.details && (
                      <pre className="mt-3 overflow-auto rounded bg-secondary p-3 text-xs">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    )}
                    {test.tables && (
                      <div className="mt-3 space-y-2">
                        {Object.entries(test.tables).map(([table, info]: [string, any]) => (
                          <div key={table} className="flex items-center gap-2 text-sm">
                            {info.exists ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-mono">{table}</span>
                            {info.error && (
                              <span className="text-red-500">- {info.error}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {test.users && (
                      <pre className="mt-3 overflow-auto rounded bg-secondary p-3 text-xs">
                        {JSON.stringify(test.users, null, 2)}
                      </pre>
                    )}
                    {test.count !== undefined && (
                      <p className="mt-2 text-sm font-semibold">
                        Total admin users: {test.count}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {results.loginTest && (
              <div className="rounded-lg border-2 border-primary bg-card p-6 shadow-card">
                <h3 className="mb-4 font-bold text-primary">Login Test Results</h3>
                <pre className="overflow-auto rounded bg-secondary p-4 text-xs">
                  {JSON.stringify(results.loginTest, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Test Login Form */}
        <div className="mt-8 rounded-lg border-2 border-accent bg-card p-6 shadow-card">
          <h2 className="mb-4 text-xl font-bold text-primary">Test Login Credentials</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Enter credentials to test the full authentication flow
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              testLogin(testEmail, testPassword);
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold">Email</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Password</label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-accent px-6 py-3 font-bold text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Login'}
            </button>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-lg border border-border bg-secondary/30 p-6">
          <h3 className="mb-3 font-bold text-primary">How to Fix Issues:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Missing environment variables:</strong> Restart dev server after editing .env
            </li>
            <li>
              <strong>Tables don't exist:</strong> Run database/cleanup.sql then database/schema.sql
              in Supabase SQL Editor
            </li>
            <li>
              <strong>No admin users:</strong> Insert your user ID into admin_users table
            </li>
            <li>
              <strong>Authentication failed:</strong> Check email/password in Supabase Auth → Users
            </li>
            <li>
              <strong>Database error:</strong> Check Supabase logs and RLS policies
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
