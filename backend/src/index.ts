import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cron from 'node-cron';
import EmailCampaign from './models/EmailCampaign.js';
import Template, { ITemplate } from './models/Template.js';
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


// --- TEMPLATES API ---

// Create a new template
app.post('/api/templates', async (req: Request, res: Response) => {
  try {
    if (!isMongoConnected && mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'MongoDB is not connected. Please start MongoDB service or check MONGO_URI in .env file.' });
    }
    const { title, subject, message } = req.body;
    const template = new Template({ title, subject, message });
    await template.save();
    console.log(`✅ Saved new template: ${title}`);
    res.status(201).json(template);
  } catch (error: any) {
    console.error('❌ Error saving template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all templates
app.get('/api/templates', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json([]);
    }
    const templates = await Template.find().sort({ createdAt: -1 });
    res.status(200).json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
app.delete('/api/templates/:id', async (req: Request, res: Response) => {
  try {
    await Template.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- CAMPAIGNS API ---

// Add a new email campaign schedule
app.post('/api/emails', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'MongoDB is not connected. Please check MONGO_URI.' });
    }

    const { name, email, templateId, startDateTime, endDateTime, sendTime } = req.body;
    
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    const newCampaign = new EmailCampaign({ 
      name, 
      email, 
      templateId,
      startDateTime: start, 
      endDateTime: end,
      sendTime: sendTime || "09:00"
    });
    
    await newCampaign.save();
    await newCampaign.populate('templateId');

    // Trigger immediate check
    checkAndSendEmails();
    
    res.status(201).json({ message: 'Email scheduled successfully!', campaign: newCampaign });
  } catch (error: any) {
    console.error('❌ Error scheduling email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all schedules
app.get('/api/emails', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json([]);
    }
    const emails = await EmailCampaign.find().populate('templateId').sort({ startDateTime: -1 });
    res.status(200).json(emails);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update schedule
app.put('/api/emails/:id', async (req: Request, res: Response) => {
  try {
    const { name, email, templateId, startDateTime, endDateTime, sendTime, isActive } = req.body;
    const updated = await EmailCampaign.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        templateId,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        sendTime,
        isActive
      },
      { new: true }
    ).populate('templateId');
    
    // Trigger immediate check in case it was updated to current time
    checkAndSendEmails();

    res.status(200).json({ message: 'Campaign updated', campaign: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete schedule
app.delete('/api/emails/:id', async (req: Request, res: Response) => {
  try {
    await EmailCampaign.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Helper function to check and send emails
const checkAndSendEmails = async () => {
  if (mongoose.connection.readyState !== 1) return;

  const now = new Date();
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  try {
    const activeEmails = await EmailCampaign.find({
      isActive: true,
      startDateTime: { $lte: now },
      endDateTime: { $gte: now }
    }).populate<{ templateId: ITemplate }>('templateId');

    for (let campaign of activeEmails) {
      const todayStr = now.toDateString();
      const lastSentStr = campaign.lastSentAt ? new Date(campaign.lastSentAt).toDateString() : null;
      
      if (lastSentStr !== todayStr && campaign.sendTime <= currentHHMM && campaign.templateId) {
        console.log(`🚀 Sending template '${campaign.templateId.title}' to ${campaign.email} (${campaign.name})...`);
        await sendEmail(
          campaign.email, 
          campaign.name, 
          campaign.templateId.subject, 
          campaign.templateId.message
        );
        
        campaign.lastSentAt = now;
        await campaign.save();
      }
    }
  } catch (error) {
    console.error('Error in checkAndSendEmails:', error);
  }
};

// CRON JOB - Runs EVERY MINUTE
cron.schedule('* * * * *', () => {
  checkAndSendEmails();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
