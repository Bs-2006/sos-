const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const HealthAssessment = require('../models/HealthAssessment');
const auth = require('../middleware/auth');

/**
 * Create a new health assessment record
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      primarySymptom,
      symptomDetails,
      urgencyLevel,
      recommendedSpecialist,
      recommendedHospitals,
      firstAidGuidance,
      conversationHistory,
      userLocation,
      emergencyDetected,
      sosTriggered,
      language
    } = req.body;

    const assessment = new HealthAssessment({
      userId: req.user.userId,
      primarySymptom,
      symptomDetails,
      urgencyLevel,
      recommendedSpecialist,
      recommendedHospitals,
      firstAidGuidance,
      conversationHistory,
      userLocation,
      emergencyDetected,
      sosTriggered,
      sosTriggeredAt: sosTriggered ? new Date() : null,
      language
    });

    await assessment.save();

    res.status(201).json({
      success: true,
      message: 'Health assessment recorded',
      assessmentId: assessment._id,
      assessment
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ error: 'Failed to create health assessment' });
  }
});

/**
 * Get health assessment by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const assessment = await HealthAssessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Verify ownership
    if (assessment.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      success: true,
      assessment
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

/**
 * Get all assessments for current user
 */
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20, skip = 0, urgencyLevel, emergencyOnly } = req.query;

    let query = { userId: req.user.userId };

    if (urgencyLevel) {
      query.urgencyLevel = urgencyLevel;
    }

    if (emergencyOnly === 'true') {
      query.emergencyDetected = true;
    }

    const assessments = await HealthAssessment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await HealthAssessment.countDocuments(query);

    res.json({
      success: true,
      assessments,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

/**
 * Update assessment status
 */
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const assessment = await HealthAssessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Verify ownership
    if (assessment.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (status) {
      assessment.status = status;
    }

    if (notes) {
      assessment.notes = notes;
    }

    assessment.updatedAt = new Date();
    await assessment.save();

    res.json({
      success: true,
      message: 'Assessment updated',
      assessment
    });
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

/**
 * Get assessment statistics for user
 */
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const matchStage = { $match: { userId: userObjectId } };

    // Run stats aggregations in parallel for better throughput
    const [stats, urgencyBreakdown, topSymptoms] = await Promise.all([
      HealthAssessment.aggregate([
        matchStage,
        {
          $group: {
            _id: null,
            totalAssessments: { $sum: 1 },
            emergencies: {
              $sum: { $cond: ["$emergencyDetected", 1, 0] }
            },
            criticalCases: {
              $sum: {
                $cond: [{ $eq: ["$urgencyLevel", "critical"] }, 1, 0]
              }
            },
            highUrgency: {
              $sum: { $cond: [{ $eq: ["$urgencyLevel", "high"] }, 1, 0] }
            },
            sosTriggered: {
              $sum: { $cond: ["$sosTriggered", 1, 0] }
            }
          }
        }
      ]),
      HealthAssessment.aggregate([
        matchStage,
        {
          $group: {
            _id: "$urgencyLevel",
            count: { $sum: 1 }
          }
        }
      ]),
      HealthAssessment.aggregate([
        matchStage,
        {
          $group: {
            _id: "$primarySymptom",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalAssessments: 0,
        emergencies: 0,
        criticalCases: 0,
        highUrgency: 0,
        sosTriggered: 0
      },
      urgencyBreakdown,
      topSymptoms
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * Delete assessment
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const assessment = await HealthAssessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Verify ownership
    if (assessment.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await HealthAssessment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Assessment deleted'
    });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

module.exports = router;
