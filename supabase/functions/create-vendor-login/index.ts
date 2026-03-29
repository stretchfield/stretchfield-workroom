import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, password, name, phone, company_name, service_category, application_id, role } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Create auth user
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authErr) throw new Error(authErr.message);

    const userId = authData.user.id;
    const assignedRole = role || "Vendor";

    // Create profile with correct role
    await supabaseAdmin.from("profiles").insert({
      id: userId,
      name,
      email,
      role: assignedRole,
      phone: phone || null,
      company_name: company_name || null,
      service_category: assignedRole === "Vendor" ? service_category : null,
      approval_status: "approved",
      login_created: true,
    });

    // Update vendor application if applicable
    if (application_id && assignedRole === "Vendor") {
      await supabaseAdmin.from("vendor_applications").update({
        status: "login-created",
        profile_id: userId,
      }).eq("id", application_id);
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
