/**
 * Cloudflare Worker for Email Dispatch
 * Can be deployed via Wrangler
 */

export default {
    async fetch(request, env) {
        // Handle CORS Pre-flight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                }
            });
        }

        // Only allow POST
        if (request.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        try {
            const body = await request.json();
            
            // Abstract Payload Formatting
            const htmlTable = buildEmailHtml(body);

            // Attempt Email Sending via defined provider strategy
            const mailResponse = await sendEmail(body, htmlTable, env);

            if (mailResponse.ok) {
                return new Response(JSON.stringify({ success: true }), {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                });
            } else {
                const errorText = await mailResponse.text();
                return new Response(JSON.stringify({ error: "Upstream email failure", details: errorText }), {
                    status: 502,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                });
            }
        } catch (e) {
            return new Response(JSON.stringify({ error: "Configuration or Payload error", message: e.message }), {
                status: 500,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }
    }
}

/**
 * Strategy abstraction for email dispatch
 * Default: MailChannels (No API key needed on CF Workers)
 * Fallback: Provider via CF Environment Variable (e.g. SENDGRID_API_KEY)
 */
async function sendEmail(body, htmlTable, env) {
    const toEmail = "ofc.omj.japan@gmail.com";
    const subject = `JLPT Result Submission - ${body.level} - ${body.name}`;

    // --- STRATEGY 1: External Provider Fallback ---
    // If you define SENDGRID_API_KEY in Cloudflare Worker secrets
    if (env.SENDGRID_API_KEY) {
        return fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.SENDGRID_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: toEmail }] }],
                from: { email: "noreply@jlpt-sim.local" },
                subject: subject,
                content: [{ type: "text/html", value: htmlTable }]
            })
        });
    }

    // --- STRATEGY 2: Default MailChannels implementation ---
    // Works automatically across Cloudflare infrastructure.
    return fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            personalizations: [{
                to: [{ email: toEmail, name: "OMJ Japan" }]
            }],
            from: { email: "result@jlpt.workers.dev", name: "JLPT Automem" },
            subject: subject,
            content: [{ type: "text/html", value: htmlTable }]
        })
    });
}

function buildEmailHtml(body) {
    const correctItems = body.correctAnswers.map(ans => `<li>${ans}</li>`).join("");
    return `
    <html>
        <head>
            <style>
                table { border-collapse: collapse; width: 100%; max-width: 600px; font-family: sans-serif; }
                th, tr { text-align: left; border: 1px solid #ddd; }
                th, td { padding: 8px; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h2>New JLPT Submission</h2>
            <table>
                <tr>
                    <th>Name</th>
                    <td>${body.name}</td>
                </tr>
                <tr>
                    <th>Identifier Code</th>
                    <td>${body.password}</td>
                </tr>
                <tr>
                    <th>Level</th>
                    <td>${body.level}</td>
                </tr>
                <tr>
                    <th>Score</th>
                    <td>${body.score}%</td>
                </tr>
            </table>

            <h3>Correct Answers Breakdown</h3>
            <ul>
                ${correctItems}
            </ul>
        </body>
    </html>
    `;
}
