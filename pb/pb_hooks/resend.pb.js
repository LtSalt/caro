/// <reference path="../pb_data/types.d.ts" />

onMailerSend((e) => {
    const apiKey = $os.getenv("RESEND_API_KEY");

    if (!apiKey) {
        console.log("RESEND_API_KEY not set, falling back to default mailer");
        return e.next();
    }

    let recipients = e.message.to;
    if (!Array.isArray(recipients)) {
        recipients = [recipients];
    }
    const toAddresses = recipients.map((r) => r.address || r);

    const res = $http.send({
        url: "https://api.resend.com/emails",
        method: "POST",
        headers: {
            "Authorization": "Bearer " + apiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: "Caro <onboarding@resend.dev>",
            to: toAddresses,
            subject: e.message.subject,
            html: e.message.html
        })
    });

    if (res.statusCode !== 200) {
        console.log("Resend error:", res.raw);
        throw new Error("Failed to send email via Resend");
    }

    console.log("Email sent via Resend to:", toAddresses.join(", "));
    // Don't call e.next() — skip the default SMTP send
});
