import fetch from 'node-fetch';

console.log("Bot-script is succesvol geladen en de timers zijn gestart!");

const VERZENDBAZEN = {
    URL: "https://pmdwbormhrtmzzmxrpea.supabase.co",
    API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZHdib3JtaHJ0bXp6bXhycGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NDg3MDMsImV4cCI6MjA4OTUyNDcwM30.DhrdMuUipZ_GDA6nlGzaCBhmmo33vKKaSJuHmsm0FY0",
    EMAIL: "boekhouding@aedontrading.nl",
    WACHTWOORD: "bybbac-xuvqiC-8tixfi"
};

const MIRAKL = {
    URL: "https://marketplace-obelink.mirakl.net/api/inbox/threads",
    API_KEY: "b57a6ad1-2004-4dda-8f45-3576b563434f"
};

async function checkRetouren() {
    try {
        console.log(`\n--- 🔄 Check gestart: ${new Date().toLocaleTimeString()} ---`);
        
        const miraklRes = await fetch(MIRAKL.URL, {
            headers: { "Authorization": MIRAKL.API_KEY, "Accept": "application/json" }
        });
        
        if (!miraklRes.ok) throw new Error(`Mirakl weigert! Code: ${miraklRes.status}`);
        const miraklData = await miraklRes.json();
        
        let alleThreads = miraklData.data || miraklData.items || miraklData.threads || [];
        if (alleThreads.length === 0) {
            const fallbackArray = Object.values(miraklData).find(val => Array.isArray(val));
            if (fallbackArray) alleThreads = fallbackArray;
        }
        
        const retourThread = alleThreads.find(thread => {
            const topic = thread.topic?.value?.toLowerCase() || "";
            return topic.includes("retour") || topic.includes("return") || topic.includes("rücksend");
        });

        if (!retourThread) {
            return console.log("💤 Geen nieuwe retourberichten gevonden.");
        }

        let orderNummer = "ONBEKEND-ID";
        if (retourThread.entities && retourThread.entities.length > 0) {
            orderNummer = retourThread.entities[0].id || retourThread.entities[0].label;
        }

        console.log(`✅ Retourbericht gevonden in Obelink! Ordernummer: ${orderNummer}`);

        const loginRes = await fetch(`${VERZENDBAZEN.URL}/auth/v1/token?grant_type=password`, {
            method: "POST",
            headers: { "apikey": VERZENDBAZEN.API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ email: VERZENDBAZEN.EMAIL, password: VERZENDBAZEN.WACHTWOORD })
        });
        
        if (!loginRes.ok) throw new Error("Inloggen bij Verzendbazen mislukt.");
        const token = (await loginRes.json()).access_token;

        const checkRes = await fetch(`${VERZENDBAZEN.URL}/rest/v1/tickets?order_number=eq.${orderNummer}&select=id`, {
            method: "GET",
            headers: { "apikey": VERZENDBAZEN.API_KEY, "Authorization": `Bearer ${token}` }
        });
        const checkData = await checkRes.json();
        
        if (checkData && checkData.length > 0) {
            return console.log(`⏩ Order ${orderNummer} heeft al een ticket! We slaan deze over.`);
        }

        const numRes = await fetch(`${VERZENDBAZEN.URL}/rest/v1/rpc/next_ticket_number`, {
            method: "POST",
            headers: { 
                "apikey": VERZENDBAZEN.API_KEY, 
                "Authorization": `Bearer ${token}`, 
                "Content-Type": "application/json" 
            },
            body: "{}"
        });

        if (!numRes.ok) throw new Error("Kon ticketnummer niet ophalen.");
        const ticketNummerRauw = await numRes.text();
        const ticketNummer = ticketNummerRauw.replace(/^"|"$/g, '').trim();

        console.log(`🎫 Ticket aanmaken in database...`);
        const ticketRes = await fetch(`${VERZENDBAZEN.URL}/rest/v1/tickets?select=*`, {
            method: "POST",
            headers: { 
                "apikey": VERZENDBAZEN.API_KEY, 
                "Authorization": `Bearer ${token}`, 
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify({
                "ticket_number": ticketNummer,
                "customer_id": "84608f8a-9435-4ce8-ac0f-b9f6115d8416",
                "status_id": "st-1",
                "priority_id": "pr-2",
                "problem_type_id": "pt-8",
                "category_id": "cat-5",
                "created_by": "77cc7dee-8bcc-4df5-815f-3c47ab875aca",
                "vestiging": "Den Helder",
                "order_number": orderNummer,
                "description": `Graag een retour label voor ${orderNummer}`,
                "shipment_number": "",
                "pickup_address": "",
                "delivery_address": "",
                "incident_date": "",
                "tracking_link": "",
                "po_number": "",
                "ean_codes": "",
                "ean_sku": ""
            })
        });

        if (ticketRes.ok) {
            console.log("🚀 SUCCES! Het ticket staat officieel in je Verzendbazen systeem.");
        } else {
            console.error("❌ Fout bij aanmaken ticket:", await ticketRes.text());
        }

    } catch (e) {
        console.error("❌ Script fout:", e.message);
    }
}

// 1. Draai direct bij opstarten
checkRetouren();

// 2. Check retouren elke 15 minuten (15 * 60 * 1000)
setInterval(checkRetouren, 2 * 60 * 1000);

// 3. Ping website elke 1 minuut (1 * 60 * 1000)
setInterval(() => {
    fetch('https://gijsnagtegaal.nl') 
        .then(() => console.log(`--- 🟢 Server ping succesvol: ${new Date().toLocaleTimeString()} ---`))
        .catch(err => console.error("--- 🔴 Ping fout: ", err.message));
}, 1 * 60 * 1000);