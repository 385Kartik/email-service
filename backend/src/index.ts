import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cron from 'node-cron';
import EmailCampaign from './models/EmailCampaign.js'; // Keeping old one just in case
import Template, { ITemplate } from './models/Template.js';
import Client, { IClient } from './models/Client.js';
import EmailLog from './models/EmailLog.js';
import { sendEmail } from './services/emailService.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let isMongoConnected = false;

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/emailService';

mongoose.connect(MONGO_URI)
  .then(() => {
    isMongoConnected = true;
    console.log('✅ MongoDB Connected Successfully to:', MONGO_URI);
  })
  .catch((err: Error) => {
    isMongoConnected = false;
    console.error('❌ MongoDB connection error:', err.message);
  });


// --- TEMPLATES API (Kept from before) ---
app.post('/api/templates', async (req: Request, res: Response) => {
  try {
    const { title, subject, message } = req.body;
    const template = new Template({ title, subject, message });
    await template.save();
    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/templates', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(200).json([]);
    const templates = await Template.find().sort({ createdAt: -1 });
    res.status(200).json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
app.delete('/api/templates/:id', async (req: Request, res: Response) => {
  try {
    await Template.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Template deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- CLIENTS API (NEW) ---

// Helper to generate unique ID (e.g., kartik-01)
const generateUniqueId = async (name: string): Promise<string> => {
  const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const count = await Client.countDocuments({ uniqueId: new RegExp(`^${baseId}-`) });
  return `${baseId}-${String(count + 1).padStart(2, '0')}`;
};

// Helper to generate unique amount
const generateUniqueAmount = async (baseAmount: number): Promise<number> => {
  const pendingClients = await Client.find({ baseAmount, status: { $ne: 'PAID' } }, 'uniqueAmount');
  const usedDecimals = pendingClients.map(c => Math.round((c.uniqueAmount - c.baseAmount) * 100));
  
  let newDecimal = 1; // start at .01
  while (usedDecimals.includes(newDecimal)) {
    newDecimal++;
  }
  return Number((baseAmount + (newDecimal / 100)).toFixed(2));
};

// Create a new client
app.post('/api/clients', async (req: Request, res: Response) => {
  try {
    const { name, email, baseAmount, dueDate, sendTime, prePaymentTemplate, postPaymentTemplate, overdueTemplate } = req.body;
    
    const uniqueId = await generateUniqueId(name);
    const uniqueAmount = await generateUniqueAmount(Number(baseAmount));

    const client = new Client({
      name,
      uniqueId,
      email,
      baseAmount,
      uniqueAmount,
      dueDate: new Date(dueDate),
      sendTime: sendTime || "09:00",
      prePaymentTemplate,
      postPaymentTemplate,
      overdueTemplate
    });

    await client.save();
    res.status(201).json({ message: 'Client created', client });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all clients
app.get('/api/clients', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(200).json([]);
    const clients = await Client.find()
      .populate('prePaymentTemplate postPaymentTemplate overdueTemplate')
      .sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark client as PAID (Triggers post-payment email)
app.put('/api/clients/:id/pay', async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id).populate<{ postPaymentTemplate: ITemplate }>('postPaymentTemplate');
    if (!client) return res.status(404).json({ error: 'Client not found' });
    if (client.status === 'PAID') return res.status(400).json({ error: 'Already paid' });

    client.status = 'PAID';
    await client.save();

    // Send post-payment email immediately
    if (client.postPaymentTemplate) {
      try {
        await sendEmail(client.email, client.name, client.postPaymentTemplate.subject, client.postPaymentTemplate.message);
        await EmailLog.create({
          client: client._id,
          template: client.postPaymentTemplate._id,
          type: 'POST_PAYMENT',
          status: 'SENT'
        });
      } catch (err: any) {
        await EmailLog.create({
          client: client._id,
          template: client.postPaymentTemplate._id,
          type: 'POST_PAYMENT',
          status: 'FAILED',
          errorMsg: err.message
        });
      }
    }

    res.status(200).json({ message: 'Marked as paid and confirmation sent', client });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- EMAIL LOGS API (NEW) ---
app.get('/api/logs', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(200).json([]);
    const logs = await EmailLog.find()
      .populate('client', 'name uniqueId email')
      .populate('template', 'title subject')
      .sort({ sentAt: -1 });
    res.status(200).json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- LEGACY CAMPAIGNS API (Keep so frontend doesn't crash yet) ---
app.post('/api/emails', async (req, res) => { /* Keep placeholder for older UI */ res.status(200).json({}); });
app.get('/api/emails', async (req, res) => { res.status(200).json([]); });
app.put('/api/emails/:id', async (req, res) => { res.status(200).json({}); });
app.delete('/api/emails/:id', async (req, res) => { res.status(200).json({}); });


// --- NEW CLIENT CRON JOB ---
const checkAndSendClientEmails = async () => {
  if (mongoose.connection.readyState !== 1) return;

  const now = new Date();
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todayStr = now.toDateString();

  try {
    const pendingClients = await Client.find({ status: { $ne: 'PAID' } })
      .populate<{ prePaymentTemplate: ITemplate, overdueTemplate: ITemplate }>('prePaymentTemplate overdueTemplate');

    for (let client of pendingClients) {
      const lastSentStr = client.lastSentAt ? new Date(client.lastSentAt).toDateString() : null;
      
      // If we haven't sent today, and it's time to send
      if (lastSentStr !== todayStr && client.sendTime <= currentHHMM) {
        
        const isOverdue = now > new Date(client.dueDate);
        const template = isOverdue ? client.overdueTemplate : client.prePaymentTemplate;
        const mailType = isOverdue ? 'OVERDUE' : 'PRE_PAYMENT';

        if (template) {
          console.log(`🚀 Sending ${mailType} to ${client.email} (${client.name})...`);
          try {
            await sendEmail(client.email, client.name, template.subject, template.message);
            await EmailLog.create({
              client: client._id,
              template: template._id,
              type: mailType,
              status: 'SENT'
            });
            // Update last sent date
            client.lastSentAt = now;
            await client.save();
          } catch (err: any) {
            console.error('Error sending email:', err);
            await EmailLog.create({
              client: client._id,
              template: template._id,
              type: mailType,
              status: 'FAILED',
              errorMsg: err.message
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in checkAndSendClientEmails:', error);
  }
};

// CRON JOB - Runs EVERY MINUTE
cron.schedule('* * * * *', () => {
  checkAndSendClientEmails();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
