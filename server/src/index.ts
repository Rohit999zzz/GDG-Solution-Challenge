import express, { Request, Response } from 'express';
import cors from 'cors';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from project root
dotenv.config({ path: join(__dirname, '../../.env') });

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());
app.use(express.json());

// --- Schema and Types ---
const ReportSchema = z.object({
  type: z.enum(['harassment', 'discrimination', 'assault', 'other']),
  description: z.string().min(10).max(1000),
  location: z.string().min(3).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

interface VerificationResult {
  assessment: string;
  severity: 'low' | 'medium' | 'high';
}

// --- Routes ---
app.get('/', (_req: Request, res: Response) => {
  res.send('Crowdsourced Reporting Platform API is running');
});

// Submit Report
app.post('/reports', async (
  req: Request<{}, any, z.infer<typeof ReportSchema>>,
  res: Response
) => {
  try {
    const reportData = ReportSchema.parse(req.body);
    
    // First verify the report
    let verificationResult: VerificationResult | undefined;
    let verified = false;
    
    if (genAI) {
      try {
        verificationResult = await verifyReport(reportData.description);
        verified = true; // If verification completes without error, mark as verified
      } catch (error) {
        console.error('Verification error:', error);
        verificationResult = {
          assessment: 'Verification failed',
          severity: 'medium' // Default to medium if verification fails
        };
        verified = false;
      }
    }

    // Insert the report into Supabase with verification results
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        ...reportData,
        verified,
        verification_result: verificationResult?.assessment,
        severity: verificationResult?.severity || 'medium'
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ 
      result: 'success', 
      data 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        result: 'error',
        message: 'Validation error',
        errors: error.errors
      });
    }
    console.error('Error submitting report:', error);
    return res.status(500).json({
      result: 'error',
      message: 'Internal server error'
    });
  }
});

// Verify Report
app.post('/verify', async (
  req: Request<{}, any, { description: string }>,
  res: Response
) => {
  try {
    const { description } = req.body;
    
    if (!description?.trim()) {
      return res.status(400).json({
        result: 'error',
        message: 'Description is required'
      });
    }

    if (!genAI) {
      return res.status(503).json({
        result: 'error',
        message: 'Verification service unavailable'
      });
    }

    const verificationResult = await verifyReport(description);
    
    return res.json({
      result: 'success',
      data: { 
        verified: true,
        verificationResult: verificationResult.assessment,
        severity: verificationResult.severity
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      result: 'error',
      message: 'Verification service error'
    });
  }
});

// --- Helper Functions ---
async function verifyReport(description: string): Promise<VerificationResult> {
  if (!genAI) {
    throw new Error('Gemini client not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `Analyze this incident report and provide an assessment. Format your response exactly as shown in this example, replacing the content with your analysis:

{
  "assessment": "This appears to be a genuine incident report describing a concerning situation. The details provided are specific and consistent.",
  "severity": "medium"
}

Base the severity on these criteria:
- low: Minor incidents with no immediate danger
- medium: Serious incidents requiring attention but not immediate danger
- high: Severe incidents involving immediate danger or harm

Report to analyze: "${description}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty verification result');
    }

    try {
      const parsedResult = JSON.parse(text.trim());
      
      // Validate severity
      const severity = parsedResult.severity?.toLowerCase();
      if (!['low', 'medium', 'high'].includes(severity)) {
        throw new Error('Invalid severity level');
      }

      return {
        assessment: parsedResult.assessment || 'Assessment unavailable',
        severity: severity as 'low' | 'medium' | 'high'
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return {
        assessment: text.trim(),
        severity: 'medium' // Default to medium if parsing fails
      };
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Verification service unavailable');
  }
}

// --- Server Setup ---
const startServer = async () => {
  const BASE_PORT = 5000;
  const MAX_RETRIES = 10;

  for (let i = 0; i < MAX_RETRIES; i++) {
    const port = BASE_PORT + i;
    try {
      await new Promise<void>((resolve, reject) => {
        const server = app.listen(port, () => {
          console.log(`Server running on port ${port}`);
          if (!genAI) {
            console.warn('Warning: Gemini verification service is not configured');
          }
          resolve();
        });

        server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying next port...`);
            server.close();
          }
          reject(error);
        });
      });
      // If we get here, the server started successfully
      break;
    } catch (error: any) {
      if (error.code !== 'EADDRINUSE' || i === MAX_RETRIES - 1) {
        console.error('Failed to start server:', error);
        process.exit(1);
      }
      // Otherwise, try the next port
    }
  }
};

startServer();