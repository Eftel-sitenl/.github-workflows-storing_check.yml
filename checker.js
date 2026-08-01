console.log("Start controle van real-time attractie- en parkdata via Queue-Times API...");

async function checkStoringen() {
    // De specifieke endpoint voor de Efteling (Park ID: 160)
    const endpoint = 'https://queue-times.com/parks/160/queue_times.json';

    try {
        const response = await fetch(endpoint, {
            headers: {
                // Herkenbare User-Agent meesturen, Queue-Times waardeert dit
                'User-Agent': 'Eftel-site-checker/1.0 (Contact: admin@eftel-site.nl)',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Server weigert de verbinding: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let storingenLijst = [];

        // --- Data parsen voor Queue-Times ---
        // Queue-Times groepeert attracties ("rides") vaak binnen themagebieden ("lands").
        // We loopen door alle "lands" en vervolgens door alle "rides" in dat gebied.
        if (data.lands && Array.isArray(data.lands)) {
            data.lands.forEach(land => {
                if (land.rides && Array.isArray(land.rides)) {
                    land.rides.forEach(ride => {
                        // Queue-Times gebruikt 'is_open' (boolean) om aan te geven of een ride draait
                        if (ride.is_open === false) {
                            storingenLijst.push(ride.name);
                        }
                    });
                }
            });
        }
        
        // Soms staan er ook attracties direct in een algemene "rides" array (buiten de "lands" om)
        if (data.rides && Array.isArray(data.rides)) {
            data.rides.forEach(ride => {
                if (ride.is_open === false && !storingenLijst.includes(ride.name)) {
                    storingenLijst.push(ride.name);
                }
            });
        }

        // --- Resultaat verwerken ---
        if (storingenLijst.length > 0) {
            console.log("⚠️ Let op: De volgende attracties zijn momenteel gesloten of in storing:");
            console.log(storingenLijst.join(", "));
            
            // Je script is succesvol uitgevoerd, dus exit code 0
            process.exit(0); 
        } else {
            console.log("✅ Alles is operationeel. Geen sluitingen gemeld op Queue-Times.");
            process.exit(0);
        }

    } catch (error) {
        console.error("❌ Fout tijdens het ophalen van de Queue-Times API:", error.message);
        
        // Laat GitHub Actions de workflow rood markeren bij een API/Netwerk fout
        process.exit(1); 
    }
}

// Voer het script uit
checkStoringen();
