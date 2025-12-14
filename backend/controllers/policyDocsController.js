import { fetchPolicyDoc } from '../services/googleDocsService.js';

// Get policy document by type
export const getPolicyDoc = async (req, res) => {
  try {
    const { type } = req.params;

    console.log(`Fetching policy document for type: ${type}`);

    const result = await fetchPolicyDoc(type);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          title: result.title,
          html: result.html,
          lastModified: result.lastModified
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message || 'Failed to fetch policy document',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in getPolicyDoc controller:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching policy document',
      error: error.message
    });
  }
};

export default {
  getPolicyDoc
};
