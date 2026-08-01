// checker.js
console.log("Start controle van real-time attractie- en parkdata...");

async function checkStoringen() {
    const endpoint = 'https://jouw-api-endpoint.nl/status'; // Vervang dit door de daadwerkelijke feed

    try {
        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`Fout bij bereiken van de server: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // --- Hier komt jouw logica om de feed te parsen ---
        // Bijvoorbeeld: checken of een specifieke attractie de status 'in onderhoud' of 'storing' heeft
        let storingenGevonden = false;

        // Voorbeeld:
        // if (data.status === 'storing') { storingenGevonden = true; }

        if (storingenGevonden) {
            console.log("⚠️ Let op: Er is een storing gedetecteerd in de data feed.");
            // Hier kun je logica toevoegen om bijvoorbeeld een webhook te sturen of een JSON te updaten
        } else {
            console.log("✅ Alles is operationeel. Geen bijzonderheden in de feed gevonden.");
        }

        // Script succesvol afronden
        process.exit(0); 

    } catch (error) {
        console.error("❌ Fout tijdens het uitvoeren van de check:", error.message);
        
        // process.exit(1) zorgt ervoor dat GitHub Actions deze run rood markeert (Failed)
        // Dit is handig zodat je direct een melding krijgt als het script zelf crasht
        process.exit(1); 
    }
}

// Voer de functie uit
checkStoringen();
