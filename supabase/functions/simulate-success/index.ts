import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fulfillInvoice } from '../_shared/fulfillment.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Fail-closed: endpoint simulasi HANYA aktif jika env var eksplisit diset ke 'true'.
  // Nilai lain (undefined, kosong, 'false', dll) → 403. Ini mencegah endpoint
  // simulasi ini tanpa sengaja terbuka di production karena env var lupa diset.
  if (Deno.env.get('ALLOW_SIMULATE_SUCCESS') !== 'true') {
    return new Response(
      JSON.stringify({ error: 'Endpoint simulasi tidak tersedia di mode produksi.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
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

    const { invoiceId } = (await req.json()) as { invoiceId: string };

    // Verifikasi kepemilikan invoice sebelum fulfillment
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('id, user_id')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice tidak ditemukan' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await fulfillInvoice(supabaseAdmin, invoiceId);

    return new Response(
      JSON.stringify({ success: true, invoiceId, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
