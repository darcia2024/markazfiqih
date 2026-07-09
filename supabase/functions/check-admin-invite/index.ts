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

    // Sebelumnya UPDATE saja, sekarang UPSERT supaya tetap berhasil walau
    // baris user_profiles belum sempat dibuat (misal user belum selesai
    // onboarding nickname saat invite di-redeem)
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(
        { user_id: user.id, is_admin: true },
        { onConflict: 'user_id', ignoreDuplicates: false },
      )
      .select('user_id')
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updated) {
      return new Response(JSON.stringify({ promoted: false, reason: 'upsert_failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: redeemError } = await supabaseAdmin
      .from('admin_invites')
      .update({ redeemed_at: new Date().toISOString(), redeemed_by: user.id })
      .eq('id', invite.id);

    if (redeemError) throw redeemError;

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
