import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Pastikan pemanggil beneran admin sebelum kasih data semua user
    const { data: callerProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!callerProfile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ambil semua auth users dengan paginasi penuh
    const allAuthUsers: any[] = [];
    let page = 1;
    while (true) {
      const { data: pageData, error: pageError } =
        await supabaseAdmin.auth.admin.listUsers({ perPage: 1000, page });
      if (pageError) throw pageError;
      allAuthUsers.push(...pageData.users);
      if (pageData.users.length < 1000) break;
      page++;
    }

    const userIds = allAuthUsers.map((u) => u.id);

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, nickname, is_admin')
      .in('user_id', userIds);
    if (profilesError) throw profilesError;

    const { data: enrollmentCounts, error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .select('user_id')
      .in('user_id', userIds);
    if (enrollError) throw enrollError;

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
    const enrollCountMap = new Map<string, number>();
    (enrollmentCounts ?? []).forEach((e: any) => {
      enrollCountMap.set(e.user_id, (enrollCountMap.get(e.user_id) ?? 0) + 1);
    });

    const result = allAuthUsers.map((u) => {
      const profile = profileMap.get(u.id);
      return {
        userId: u.id,
        email: u.email ?? '',
        nickname: profile?.nickname ?? null,
        isAdmin: profile?.is_admin ?? false,
        createdAt: u.created_at,
        enrollmentCount: enrollCountMap.get(u.id) ?? 0,
      };
    });

    return new Response(JSON.stringify({ users: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
