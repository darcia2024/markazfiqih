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
    if (authError || !user || !user.email) {
      return new Response(JSON.stringify({ promoted: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const normalizedEmail = user.email.toLowerCase().trim();

    const { data: invite } = await supabaseAdmin
      .from('admin_invites')
      .select('id')
      .eq('email', normalizedEmail)
      .is('redeemed_at', null)
      .maybeSingle();

    if (!invite) {
      return new Response(JSON.stringify({ promoted: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Hanya redeem invite kalau promote benar-benar berhasil mengubah baris
    // profil user (mis. profil belum ter-provisioning saat ini dipanggil).
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ is_admin: true })
      .eq('user_id', user.id)
      .select('user_id')
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updated) {
      return new Response(JSON.stringify({ promoted: false, reason: 'profile_not_found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabaseAdmin
      .from('admin_invites')
      .update({ redeemed_at: new Date().toISOString(), redeemed_by: user.id })
      .eq('id', invite.id);

    return new Response(JSON.stringify({ promoted: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
