// Public browser configuration. Never put a service-role or secret key here.
// Add ?demo=1 to the website URL for a local demonstration with sample data.
window.MPC_CONFIG = {
  supabaseUrl: "https://ilijcejzqkhdlnvnxqsg.supabase.co",
  supabasePublishableKey: "sb_publishable_lrgKciIxuiapSWhiifvZPQ_TZA8h5gB"
};
// An explicit demo is isolated from the shared database.
if (new URLSearchParams(location.search).get('demo') === '1') {
  window.MPC_CONFIG = {supabaseUrl:"",supabasePublishableKey:""};
}
