// src/pages/api/contact.js
const prerender = false;

async function POST({ request }) {
  try {
    const data = await request.json();
    
    console.log('Received form data:', { ...data, email: data.email });

    // Validate required fields
    if (!data.name || !data.email || !data.reason || !data.message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required fields' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 1. Send to Google Sheet (optional)
    if (process.env.GOOGLE_SCRIPT_URL) {
      try {
        await fetch(process.env.GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
      } catch (sheetError) {
        console.error('Google Sheet error:', sheetError);
      }
    }

    // 2. Send email via Brevo
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY || ""
      },
      body: JSON.stringify({
        sender: {
          name: "ActionPath Africa",
          email: "info@actionpathafrica.org"
        },
        to: [
          {
            email: process.env.RECEIVER_EMAIL || "info@actionpathafrica.org"
          }
        ],
        subject: `New Contact Form Submission: ${data.reason}`,
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              h2 { color: #c0392b; border-bottom: 2px solid #27ee31; padding-bottom: 10px; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #1e293b; }
              .value { margin-top: 5px; background: #f5f7fa; padding: 10px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>New Contact Form Submission</h2>
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${escapeHtml(data.name)}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value">${escapeHtml(data.email)}</div>
              </div>
              <div class="field">
                <div class="label">Phone:</div>
                <div class="value">${escapeHtml(data.phone || 'Not provided')}</div>
              </div>
              <div class="field">
                <div class="label">Organization:</div>
                <div class="value">${escapeHtml(data.organization || 'Not provided')}</div>
              </div>
              <div class="field">
                <div class="label">Reason:</div>
                <div class="value">${escapeHtml(data.reason)}</div>
              </div>
              <div class="field">
                <div class="label">Message:</div>
                <div class="value">${escapeHtml(data.message)}</div>
              </div>
              <div class="field">
                <div class="label">Newsletter Subscription:</div>
                <div class="value">${data.newsletter ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </body>
          </html>
        `,
        replyTo: {
          email: data.email,
          name: data.name
        }
      })
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error('Brevo API error:', brevoResponse.status, errorText);
      throw new Error(`Brevo API error: ${brevoResponse.status}`);
    }

    const brevoResult = await brevoResponse.json();
    console.log('Email sent successfully:', brevoResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message sent successfully' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('API Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Helper function to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
