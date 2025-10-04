import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const password = authHeader.replace('Bearer ', '');
    const adminPassword = Deno.env.get('ADMIN_PASSWORD') || 'Results@2025';
    
    if (password !== adminPassword) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: sessions, error: sessionsError } = await supabase
      .from('quiz_sessions')
      .select(`
        *,
        profiles(email, full_name)
      `)
      .order('created_at', { ascending: false });

    if (sessionsError) throw sessionsError;

    const sessionIds = sessions?.map(s => s.id) || [];
    
    const { data: answers, error: answersError } = await supabase
      .from('quiz_answers')
      .select('*')
      .in('session_id', sessionIds);

    if (answersError) throw answersError;

    const { data: domainStats, error: statsError } = await supabase
      .from('domain_stats')
      .select('*')
      .in('session_id', sessionIds);

    if (statsError) throw statsError;

    return new Response(
      JSON.stringify({
        sessions,
        answers,
        domainStats,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});