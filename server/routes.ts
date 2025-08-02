import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertIssueSchema, insertIssueFlagSchema, insertIssueVoteSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for photo uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3, // Maximum 3 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Issue routes
  app.post('/api/issues', isAuthenticated, upload.array('photos', 3), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.isBanned) {
        return res.status(403).json({ message: 'Account is banned' });
      }

      // Validate request body
      const issueData = insertIssueSchema.parse({
        ...req.body,
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
        reporterId: req.body.isAnonymous === 'true' ? null : userId,
        isAnonymous: req.body.isAnonymous === 'true',
        photos: req.files ? req.files.map((file: any) => file.path) : [],
      });

      const issue = await storage.createIssue(issueData);
      
      // Create initial status log
      await storage.createStatusLog({
        issueId: issue.id,
        oldStatus: null,
        newStatus: 'reported',
        changedBy: userId,
        notes: 'Issue reported',
      });

      res.status(201).json(issue);
    } catch (error) {
      console.error('Error creating issue:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create issue' });
    }
  });

  app.get('/api/issues/nearby', async (req, res) => {
    try {
      const { lat, lng, radius = 5, category, status, limit = 50, offset = 0 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusKm = parseFloat(radius as string);

      const issues = await storage.getIssuesNearLocation(latitude, longitude, radiusKm, {
        category: category as string,
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json(issues);
    } catch (error) {
      console.error('Error fetching nearby issues:', error);
      res.status(500).json({ message: 'Failed to fetch issues' });
    }
  });

  app.get('/api/issues/:id', async (req, res) => {
    try {
      const issue = await storage.getIssue(req.params.id);
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }
      res.json(issue);
    } catch (error) {
      console.error('Error fetching issue:', error);
      res.status(500).json({ message: 'Failed to fetch issue' });
    }
  });

  app.get('/api/issues/:id/status-logs', async (req, res) => {
    try {
      const logs = await storage.getIssueStatusLogs(req.params.id);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching status logs:', error);
      res.status(500).json({ message: 'Failed to fetch status logs' });
    }
  });

  // Issue interaction routes
  app.post('/api/issues/:id/flag', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const issueId = req.params.id;

      // Check if user already flagged this issue
      const existingFlag = await storage.getUserFlaggedIssue(issueId, userId);
      if (existingFlag) {
        return res.status(400).json({ message: 'Issue already flagged by user' });
      }

      const flagData = insertIssueFlagSchema.parse({
        issueId,
        flaggerId: userId,
        reason: req.body.reason,
      });

      await storage.flagIssue(flagData);
      res.status(201).json({ message: 'Issue flagged successfully' });
    } catch (error) {
      console.error('Error flagging issue:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to flag issue' });
    }
  });

  app.post('/api/issues/:id/vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const issueId = req.params.id;

      // Check if user already voted for this issue
      const existingVote = await storage.getUserVoteForIssue(issueId, userId);
      if (existingVote) {
        return res.status(400).json({ message: 'User already voted for this issue' });
      }

      const voteData = insertIssueVoteSchema.parse({
        issueId,
        voterId: userId,
      });

      await storage.voteForIssue(voteData);
      res.status(201).json({ message: 'Vote recorded successfully' });
    } catch (error) {
      console.error('Error voting for issue:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to record vote' });
    }
  });

  // Admin routes
  app.get('/api/admin/issues/flagged', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const flaggedIssues = await storage.getFlaggedIssues();
      res.json(flaggedIssues);
    } catch (error) {
      console.error('Error fetching flagged issues:', error);
      res.status(500).json({ message: 'Failed to fetch flagged issues' });
    }
  });

  app.get('/api/admin/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const analytics = await storage.getIssueAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  app.patch('/api/admin/issues/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { status, notes } = req.body;
      const updatedIssue = await storage.updateIssueStatus(req.params.id, status, userId, notes);
      
      if (!updatedIssue) {
        return res.status(404).json({ message: 'Issue not found' });
      }

      res.json(updatedIssue);
    } catch (error) {
      console.error('Error updating issue status:', error);
      res.status(500).json({ message: 'Failed to update issue status' });
    }
  });

  app.patch('/api/admin/issues/:id/hide', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      await storage.hideIssue(req.params.id);
      res.json({ message: 'Issue hidden successfully' });
    } catch (error) {
      console.error('Error hiding issue:', error);
      res.status(500).json({ message: 'Failed to hide issue' });
    }
  });

  app.patch('/api/admin/users/:id/ban', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      await storage.banUser(req.params.id);
      res.json({ message: 'User banned successfully' });
    } catch (error) {
      console.error('Error banning user:', error);
      res.status(500).json({ message: 'Failed to ban user' });
    }
  });

  app.patch('/api/admin/users/:id/unban', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      await storage.unbanUser(req.params.id);
      res.json({ message: 'User unbanned successfully' });
    } catch (error) {
      console.error('Error unbanning user:', error);
      res.status(500).json({ message: 'Failed to unban user' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
