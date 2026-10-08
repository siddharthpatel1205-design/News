// Payment abstraction. Only the DEMO provider exists today (no real money moves).
// To add a real gateway later: register a provider here that (1) asks an Edge Function to create an order,
// (2) opens the gateway checkout, and (3) lets a VERIFIED webhook activate the subscription server-side.
// Never activate paid subscriptions from browser code, and turn off "demo_payments_enabled" in Admin → Settings before going live.
const NVPayment = {
  provider: "demo",
  providers: {
    demo: {
      label: "डेमो भुगतान",
      async pay(o) {
        const { data, error } = await sb.rpc("create_demo_subscription", { p_plan: o.planId, p_billing: o.billing, p_code: o.code || null });
        return error ? { ok: false, message: "भुगतान पूरा नहीं हो सका। कृपया दोबारा कोशिश करें।" } : data;
      }
    }
  },
  pay(o) { return this.providers[this.provider].pay(o); },
  money(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
};
