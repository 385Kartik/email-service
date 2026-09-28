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
import Settings from './models/Settings.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- SETTINGS API ---
app.get('/api/settings', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(200).json({});
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    if (req.body.smtpEmail !== undefined) settings.smtpEmail = req.body.smtpEmail;
    if (req.body.smtpPassword !== undefined) settings.smtpPassword = req.body.smtpPassword;
    if (req.body.senderName !== undefined) settings.senderName = req.body.senderName;
    await settings.save();
    res.status(200).json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/test', async (req: Request, res: Response) => {
  try {
    const { to } = req.body;
    await sendEmail(to, 'Admin Test', 'Test Connection', 'Your Devoraaa email settings are working perfectly!');
    res.status(200).json({ message: 'Test email sent successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

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

// Create a new client (No templates here anymore!)
app.post('/api/clients', async (req: Request, res: Response) => {
  try {
    const { name, email, baseAmount, startDate, dueDate, endDate } = req.body;
    
    const uniqueId = await generateUniqueId(name);
    const uniqueAmount = await generateUniqueAmount(Number(baseAmount));

    const client = new Client({
      name,
      uniqueId,
      email,
      baseAmount,
      uniqueAmount,
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      endDate: new Date(endDate),
      schedules: []
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
      .populate('schedules.templateId')
      .sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add a schedule to a client
app.post('/api/clients/:id/schedules', async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    
    client.schedules.push(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a schedule from a client
app.delete('/api/clients/:id/schedules/:scheduleId', async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    
    client.schedules = client.schedules.filter(s => s._id?.toString() !== req.params.scheduleId) as any;
    await client.save();
    res.status(200).json(client);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark client as PAID (Triggers ON_PAID schedules)
app.put('/api/clients/:id/pay', async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id).populate('schedules.templateId');
    if (!client) return res.status(404).json({ error: 'Client not found' });
    if (client.status === 'PAID') return res.status(400).json({ error: 'Already paid' });

    client.status = 'PAID';
    await client.save();

    // Find and send all ON_PAID templates
    const onPaidSchedules = client.schedules.filter(s => s.triggerType === 'ON_PAID' && s.isActive);
    
    for (const schedule of onPaidSchedules) {
      const template = schedule.templateId as any as ITemplate;
      if (template) {
        try {
          await sendEmail(client.email, client.name, template.subject, template.message, { endDate: client.endDate });
          await EmailLog.create({
            client: client._id,
            template: template._id,
            type: 'POST_PAYMENT',
            status: 'SENT'
          });
        } catch (err: any) {
          await EmailLog.create({
            client: client._id,
            template: template._id,
            type: 'POST_PAYMENT',
            status: 'FAILED',
            errorMsg: err.message
          });
        }
      }
    }

    res.status(200).json({ message: 'Marked as paid and confirmations sent', client });
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


// --- NEW CLIENT CRON JOB ---
const checkAndSendClientEmails = async () => {
  if (mongoose.connection.readyState !== 1) return;

  const now = new Date();
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todayStr = now.toDateString();

  try {
    const pendingClients = await Client.find({ status: { $ne: 'PAID' } })
      .populate('schedules.templateId');

    for (let client of pendingClients) {
      const clientStart = new Date(client.startDate);
      clientStart.setHours(0, 0, 0, 0);
      const clientEnd = new Date(client.endDate);
      clientEnd.setHours(23, 59, 59, 999);
      
      if (now < clientStart || now > clientEnd) {
        continue;
      }
      
      const isOverdue = now > new Date(client.dueDate);

      for (let schedule of client.schedules) {
        if (!schedule.isActive || schedule.triggerType === 'ON_PAID') continue;
        
        // Time check
        if (schedule.sendTime !== currentHHMM) continue;

        // Daily sent check (don't send the same schedule twice today)
        const lastSentStr = schedule.lastSentAt ? new Date(schedule.lastSentAt).toDateString() : null;
        if (lastSentStr === todayStr) continue;

        // Trigger Type Check
        let shouldSend = false;
        
        if (schedule.triggerType === 'DAILY_BEFORE_DUE' && !isOverdue) shouldSend = true;
        else if (schedule.triggerType === 'DAILY_OVERDUE' && isOverdue) shouldSend = true;
        else if (schedule.triggerType === 'SPECIFIC_DATE' && schedule.specificDate) {
          const specDate = new Date(schedule.specificDate).toDateString();
          if (specDate === todayStr) shouldSend = true;
        }

        if (shouldSend) {
          const template = schedule.templateId as any as ITemplate;
          if (template) {
            console.log(`🚀 Sending ${schedule.triggerType} to ${client.email} (${client.name})...`);
            try {
              await sendEmail(client.email, client.name, template.subject, template.message, { endDate: client.endDate });
              await EmailLog.create({
                client: client._id,
                template: template._id,
                type: isOverdue ? 'OVERDUE' : 'PRE_PAYMENT',
                status: 'SENT'
              });
              schedule.lastSentAt = now;
              await client.save();
            } catch (err: any) {
              console.error('Error sending email:', err);
              await EmailLog.create({
                client: client._id,
                template: template._id,
                type: isOverdue ? 'OVERDUE' : 'PRE_PAYMENT',
                status: 'FAILED',
                errorMsg: err.message
              });
            }
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
