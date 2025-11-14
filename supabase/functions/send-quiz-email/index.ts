import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string;
  userName: string;
  finalScore: number;
  questionsAnswered: number;
  optimalAnswers: number;
  accuracy: number;
  reportUrl: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, userName, finalScore, questionsAnswered, optimalAnswers, accuracy, reportUrl }: EmailRequest = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ error: "Email address is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #F72585 0%, #009DDC 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .stat-box {
      background: white;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #F72585;
      border-radius: 4px;
    }
    .stat-label {
      color: #718096;
      font-size: 14px;
    }
    .stat-value {
      color: #F72585;
      font-size: 24px;
      font-weight: bold;
    }
    .button {
      display: inline-block;
      background: #F72585;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #718096;
      font-size: 12px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧠 Blueprint</h1>
      <p>Your Quiz Results Are Ready!</p>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Congratulations on completing your cognitive assessment quiz! Here's a summary of your performance:</p>

      <div class="stat-box">
        <div class="stat-label">Questions Answered</div>
        <div class="stat-value">${questionsAnswered}</div>
      </div>

      <div class="stat-box">
        <div class="stat-label">Total Score</div>
        <div class="stat-value">${finalScore}</div>
      </div>

      <div class="stat-box">
        <div class="stat-label">Optimal Answers</div>
        <div class="stat-value">${optimalAnswers}</div>
      </div>

      <div class="stat-box">
        <div class="stat-label">Overall Accuracy</div>
        <div class="stat-value">${accuracy}%</div>
      </div>

      ${reportUrl ? `
      <div style="text-align: center;">
        <a href="${reportUrl}" class="button">View Full Report</a>
      </div>
      ` : ''}

      <p>Keep practicing to improve your cognitive skills across all domains!</p>

      <p>Best regards,<br>The Blueprint Team</p>
    </div>
    <div class="footer">
      <p>This email was sent from Blueprint</p>
    </div>
  </div>
</body>
</html>
    `;

    console.log(`Simulating email send to: ${to}`);
    console.log("Email content prepared successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email functionality ready. In production, would send to: ${to}`,
        preview: emailHtml
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error processing email request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
