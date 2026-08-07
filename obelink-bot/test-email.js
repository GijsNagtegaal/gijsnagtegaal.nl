import fetch from 'node-fetch';

const API_KEY = "b57a6ad1-2004-4dda-8f45-3576b563434f";
const ORDER_NR = "2003447764-A"; // Eén van jouw orders!

async function zoekEmail() {
    console.log(`🔍 Order ${ORDER_NR} ophalen uit de API...`);
    
    const res = await fetch(`https://marketplace-obelink.mirakl.net/api/orders?order_ids=${ORDER_NR}`, {
        headers: { "Authorization": API_KEY, "Accept": "application/json" }
    });

    const data = await res.json();
    
    if (data.orders && data.orders.length > 0) {
        console.log("✅ Order gevonden! Hier is de ruwe data van de klant:\n");
        console.log(JSON.stringify(data.orders[0].customer, null, 2));
        
        console.log("\nKijk hierboven 👆 ergens in deze lijst moet het e-mailadres staan. Hoe noemt Obelink het veld?");
    } else {
        console.log("❌ Order niet gevonden in de API.");
    }
}

zoekEmail();