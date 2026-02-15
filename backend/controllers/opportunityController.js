/**
 * Opportunity Controller - Internships & Research
 */
import Opportunity from '../models/Opportunity.js';
import OpportunityApplication from '../models/OpportunityApplication.js';

/**
 * @route   GET /api/opportunities
 * @desc    Get all opportunities, filter by type
 */
export const getOpportunities = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { status: 'active' };
    if (type) query.type = type;

    const opportunities = await Opportunity.find(query)
      .populate('postedBy', 'name email')
      .sort({ deadline: 1, createdAt: -1 })
      .lean();

    // Auto-close expired
    const now = new Date();
    const expired = opportunities.filter((o) => o.deadline && new Date(o.deadline) < now);
    if (expired.length) {
      await Opportunity.updateMany(
        { _id: { $in: expired.map((e) => e._id) } },
        { status: 'closed' }
      );
    }
    const active = opportunities.filter((o) => !o.deadline || new Date(o.deadline) >= now);
    res.json(active);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/opportunities
 * @desc    Admin/Faculty: post opportunity
 */
export const postOpportunity = async (req, res, next) => {
  try {
    const { title, company, facultyName, type, stipend, deadline, eligibility, applyLink, description } = req.body;
    if (!title || !type) {
      return res.status(400).json({ message: 'title and type are required' });
    }

    const opp = await Opportunity.create({
      title,
      company: company || '',
      facultyName: facultyName || '',
      type,
      stipend: stipend || '',
      deadline: deadline || null,
      eligibility: eligibility || '',
      applyLink: applyLink || '',
      description: description || '',
      postedBy: req.user._id,
    });

    const populated = await Opportunity.findById(opp._id).populate('postedBy', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/opportunities/:id/apply
 * @desc    Student: apply or save opportunity
 */
export const applyOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    if (opp.status === 'closed') {
      return res.status(400).json({ message: 'Opportunity has expired' });
    }

    const { action } = req.body; // 'saved' or 'applied'
    const app = await OpportunityApplication.findOneAndUpdate(
      { opportunity: req.params.id, user: req.user._id },
      { status: action === 'applied' ? 'applied' : 'saved' },
      { upsert: true, new: true }
    )
      .populate('opportunity')
      .populate('user', 'name email');
    res.json(app);
  } catch (error) {
    next(error);
  }
};
