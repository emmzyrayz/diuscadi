// scripts/broadcast-registration-retry.ts
//
// One-time broadcast: notify users whose LASCADSS 7.0 guest registration
// was stuck on OTP verification that their record has been cleared and
// they can retry.
//
// Run from project root:
//   pnpm dotenv -e .env.local -- tsx scripts/broadcast-registration-retry.ts

import { sendBulkBroadcast } from "@/lib/sendEmail";

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_URL =
  "https://www.diuscadi.org.ng/event-landing/lascadss-70-life-after-school-career-development-seminar-series";

const CAMPAIGN_NAME = "LASCADSS 7.0 — Registration Retry (June 2026)";

const SUBJECT = "Action Required — Complete Your LASCADSS 7.0 Registration";

// ─── Known invalid emails — skipped with reason ───────────────────────────────

const SKIP: Record<string, string> = {
  "mabelchika921@gmail.como": "typo in TLD (.como)",
  "chinedunwandu81@gmal.com": "typo in domain (gmal.com)",
};

// ─── Raw contact list ────────────────────────────────────────────────────────

const RAW_CONTACTS = [
  { email: "kennethadaeze88@gmail.com", name: "Adaeze" },
  { email: "ugochiangel1205@gmail.com", name: "Angel" },
  { email: "ugochiangel12@gmail.com", name: "Angel" },
  { email: "adannachikaodi6@gmail.com", name: "Adanna" },
  { email: "nadaeze690@gmail.com", name: "Adaeze" },
  { email: "kennethadaeze8@gmail.com", name: "Adaeze" },
  { email: "onunkwo019@gmail.com", name: "Amara" },
  { email: "preciousekechukwu99@gmail.com", name: "Precious" },
  { email: "osuohaesther1@gmail.com", name: "Esther" },
  { email: "kambilistephanie6@gmail.com", name: "Stephanie" },
  { email: "danieluzochukwu0000@gmail.com", name: "Daniel" },
  { email: "kambilistephanie@gmail.com", name: "Stephanie" },
  { email: "skt.okoli@stu.unizik.edu.ng", name: "Stephanie" },
  { email: "mabelchika921@gmail.como", name: "Chike" }, // INVALID — skipped
  { email: "chisomkambili@gmail.com", name: "Chisom" },
  { email: "nnamdionwuchekwa5@gmail.com", name: "Nnamdi" },
  { email: "divinefavour.nwachukwu09@gmail.com", name: "Divinefavour" },
  { email: "mabelchika921@gmail.com", name: "Chika" },
  { email: "oukohah@gmail.com", name: "Onyinye" },
  { email: "dabbichuks@gmail.com", name: "Babatunde" },
  { email: "agbaihenryobinna@gmail.com", name: "Obinna" },
  { email: "alazorrosemaryuchechukwu@gmail.com", name: "Rosemary" },
  { email: "michealadaugo@gmail.com", name: "Adaugo" },
  { email: "mrfantasy300@gmail.com", name: "Friend" },
  { email: "chinyereokechukwu399@gmail.com", name: "Chinyere" },
  { email: "coh.okechukwu@stu.unizik.edu.ng", name: "Chinyere" },
  { email: "okwuchukwurita2003@gmail.com", name: "Rita" },
  { email: "okolochiomafaith@gmail.com", name: "Chioma" },
  { email: "favourmarvelous06@gmail.com", name: "Favour" },
  { email: "chinweubachiamaka3@gmail.com", name: "Chiamaka" },
  { email: "favourmarvelous2006@gmail.com", name: "Favour" },
  { email: "chinwubab453@gmail.com", name: "Chiamaka" },
  { email: "eezedimbu@gmail.com", name: "Ebube" },
  { email: "preciousgodson08@gmail.com", name: "Precious" },
  { email: "preshokafor1@gmail.com", name: "Blessing" },
  { email: "faithtalksmoney@gmail.com", name: "Faith" },
  { email: "chinedunwandu81@gmal.com", name: "Chinedu" }, // INVALID — skipped
  { email: "anazodofaith2023@gmail.com", name: "Faith" },
  { email: "chukwunekezichinenye@gmail.com", name: "Chinenye" },
  { email: "gi.loveday@stu.unizik.edu.ng", name: "Godsgift" },
  { email: "ifeanachochidiebere2005@gmail.com", name: "Joy" },
  { email: "blessingchidimma002@gmail.com", name: "Blessing" },
  { email: "strangeblood002@gmail.com", name: "Nwogbaga" },
  { email: "nwafada806@gmail.com", name: "Oguejiofor" },
  { email: "ojukwujacinta2@gmail.com", name: "Jacinta" },
  { email: "okwuosaaloysius@gmail.com", name: "Aloysius" },
  { email: "nebochris82@gmail.com", name: "Nebo" },
  { email: "okwuosaaloysius4@gmail.com", name: "Aloysius" },
  { email: "osigwesophia7@gmail.com", name: "Sophia" },
  { email: "jacinthachiamaka5@gmail.com", name: "Jacintha" },
  { email: "amarachiprincess230@gmail.com", name: "Princess" },
  { email: "rebeccaokoronkwo13@gmail.com", name: "Rebecca" },
  { email: "chinazaekpereokoronkwo@gmail.com", name: "Chinaza" },
  { email: "faithobiorah1@gmail.com", name: "Faith" },
  { email: "adannafumeh@gmail.com", name: "Adanna" },
  { email: "talk2odinaka@gmail.com", name: "Odinaka" },
  { email: "raphaelobiadi@gmail.com", name: "Raphael" },
  { email: "viviannnolum23@gmail.com", name: "Vivian" },
  { email: "ofochebechinecherem@gmail.com", name: "Chinecherem" },
  { email: "ginikachukwuedward@gmail.com", name: "Ginikachukwu" },
  { email: "chinwubaolisa3@gmail.com", name: "Chinwuba" },
  { email: "ozobialkenechukwu@gmail.com", name: "Kenechukwu" },
  { email: "josphinenkiruka4@gmail.com", name: "Nkiruka" },
  { email: "kelechiibegbunam291@gmail.com", name: "Kelechi" },
  { email: "godwinebubechukwu2@gmail.com", name: "Godwin" },
  { email: "anazodofaith13@gmail.com", name: "Faith" },
  { email: "chiemekaprosper59@gmail.com", name: "Prosper" },
  { email: "nnaedoziechukwuogo@gmail.com", name: "Nnaedozie" },
  { email: "ikejioforchisomgift@gmail.com", name: "Gift" },
  { email: "johnboscoval500@gmail.com", name: "Johnbosco" },
  { email: "beatricescandal@gmail.com", name: "Beatrice" },
  { email: "nmesomaedwin6@gmail.com", name: "Nmesoma" },
  { email: "favouriteonyeije1@gmail.com", name: "Favourite" },
  { email: "eboigbecynthia27@gmail.com", name: "Cynthia" },
  { email: "osinachipaul65@gmail.com", name: "Osinachi" },
  { email: "bisolaashante@gmail.com", name: "Abisola" },
  { email: "emmyflash42@gmail.com", name: "Emmanuella" },
  { email: "marvellousjosephogbatue@gmail.com", name: "Marvellous" },
  { email: "jc.ifeanacho@stu.unizik.edu.ng", name: "Joy" },
  { email: "fc25festiveboss@gmail.com", name: "David" },
  { email: "xavinnovations@gmail.com", name: "David" },
  { email: "ogechibenzaach13@gmail.com", name: "Ogechi" },
  { email: "nwanduchinedu2002@gmail.com", name: "Chinedu" },
  { email: "richmarleyfoundation@gmail.com", name: "Udosolum" },
  { email: "uba.thelmad@gmail.com", name: "Thelma" },
  { email: "benedictanwachukwu456@gmail.com", name: "Benedicta" },
  { email: "princessanitau@gmail.com", name: "Anita" },
  { email: "ehmaamuzie@gmail.com", name: "Flora" },
  { email: "okonkwojenzy2005@gmail.com", name: "Amarachi" },
  { email: "masterwise001@gmail.com", name: "Ukpabi" },
  { email: "i.am.chimdindu@gmail.com", name: "Chimdindu" },
  { email: "nnolumvivian@gmail.com", name: "Vivian" },
  { email: "vickthor014@gmail.com", name: "Victor" },
  { email: "mmesomaokegbe319@gmail.com", name: "Mmesoma" },
  { email: "joshchukwudum@gmail.com", name: "Chukwudum" },
  { email: "erengwachigemezu@gmail.com", name: "Erengwa" },
  { email: "nwanelimalone@gmail.com", name: "Nwaneli" },
  { email: "nwanelieric@gmail.com", name: "Nwaneli" },
  { email: "benpromise682@gmail.com", name: "Chinaza" },
  { email: "chinazaedwin28@gmail.com", name: "Chinaza" },
  { email: "favourogboh3@gmail.com", name: "Favour" },
  { email: "vhh23713@gmail.com", name: "Precious" },
  { email: "adimikesylvia@gmail.com", name: "Sylvia" },
  { email: "ukpabichinazaekpere9@gmail.com", name: "Ukpabi" },
];

// ─── Email content ────────────────────────────────────────────────────────────
// {{name}} is replaced per-recipient by mailer.ts applyMergeTags()

const HTML_CONTENT = `
<p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#0f172a;">
  Hi {{name}},
</p>

<p style="margin:0 0 16px;font-size:13px;color:#475569;line-height:1.8;">
  We noticed your recent attempt to register for
  <strong>LASCADSS 7.0 — Life After School: Career Development Seminar Series</strong>
  ran into a verification issue. Your previous registration attempt has now been
  cleared from our system so you can start fresh with a clean slate.
</p>

<p style="margin:0 0 16px;font-size:13px;color:#475569;line-height:1.8;">
  To secure your spot, simply visit the event page and complete your registration.
  The process takes less than 2 minutes — enter your details, verify your email
  with the OTP code you'll receive, and you're confirmed.
</p>

<div style="margin:28px 0;text-align:center;">
  <a href="${EVENT_URL}"
     style="display:inline-block;background:#0f172a;color:#ffffff;
            text-decoration:none;font-size:11px;font-weight:900;
            text-transform:uppercase;letter-spacing:0.2em;
            padding:16px 36px;border-radius:12px;">
    Register for LASCADSS 7.0 →
  </a>
</div>

<div style="margin:24px 0;background:#fefce8;border-left:4px solid #facc15;
            border-radius:8px;padding:14px 18px;">
  <p style="margin:0;font-size:12px;font-weight:700;color:#92400e;">
    ⚠ Important — please use the OTP code that arrives in your inbox
    immediately after submitting your registration. Codes expire after 15 minutes.
    If yours expires, simply start the registration again.
  </p>
</div>

<p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.7;">
  If you run into any issues or have questions, reply to this email or reach us at
  <a href="mailto:info@diuscadi.org.ng"
     style="color:#0f172a;font-weight:700;">
    info@diuscadi.org.ng
  </a>.
  We're happy to help you get registered.
</p>
`;

const TEXT_CONTENT = `Hi {{name}},

We noticed your recent attempt to register for LASCADSS 7.0 — Life After School: Career Development Seminar Series ran into a verification issue.

Your previous registration attempt has been cleared. You can now re-register using the link below:

${EVENT_URL}

Important: use the OTP code that arrives in your inbox immediately — codes expire after 15 minutes. If yours expires, start the registration again.

Need help? Email us at info@diuscadi.org.ng.

— The DIUSCADI Team`;

// ─── Build clean contact list ─────────────────────────────────────────────────

function buildContacts() {
  const skipped: { email: string; reason: string }[] = [];
  const seen = new Set<string>();
  const contacts: { email: string; name: string }[] = [];

  for (const c of RAW_CONTACTS) {
    const email = c.email.trim().toLowerCase();

    // Skip known invalid
    if (SKIP[email]) {
      skipped.push({ email, reason: SKIP[email] });
      continue;
    }

    // Deduplicate — keep first occurrence
    if (seen.has(email)) {
      skipped.push({ email, reason: "duplicate — already queued" });
      continue;
    }

    seen.add(email);
    contacts.push({ email, name: c.name.trim() });
  }

  return { contacts, skipped };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { contacts, skipped } = buildContacts();

  console.log(
    "\n── LASCADSS 7.0 Registration Retry Broadcast ─────────────────",
  );
  console.log(`  Total raw:   ${RAW_CONTACTS.length}`);
  console.log(`  Valid:       ${contacts.length}`);
  console.log(`  Skipped:     ${skipped.length}`);

  if (skipped.length > 0) {
    console.log("\n  Skipped addresses:");
    skipped.forEach((s) => console.log(`    ✗  ${s.email}  (${s.reason})`));
  }

  console.log("\n  Sending via Resend Batch API...\n");

  const result = await sendBulkBroadcast({
    campaignName: CAMPAIGN_NAME,
    subject: SUBJECT,
    htmlContent: HTML_CONTENT,
    textContent: TEXT_CONTENT,
    contacts,
  });

  console.log(
    "── Result ─────────────────────────────────────────────────────",
  );
  console.log(`  ✓ Sent:   ${result.sent}`);
  console.log(`  ✗ Failed: ${result.failed.length}`);

  if (result.failed.length > 0) {
    console.log("\n  Failed addresses (retry manually):");
    result.failed.forEach((f) =>
      console.log(`    ✗  ${f.email}  — ${f.error}`),
    );
  }

  console.log("\n  Done.\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
