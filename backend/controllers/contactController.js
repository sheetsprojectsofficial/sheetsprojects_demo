import Contact from '../models/Contact.js';

const contactController = {
  // Get contact data
  getContact: async (req, res) => {
    try {
      let contact = await Contact.findOne();
      
      if (!contact) {
        // Create default contact data if none exists
        contact = new Contact({
          heading: 'Get in Touch',
          subheading: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
          contactInfo: {
            email: 'sheetsprojectsofficial@gmail.com',
            phone: '+91 9213723036',
            businessHours: {
              weekdays: 'Mon - Fri: 9:00 AM - 6:00 PM',
              weekends: 'Weekends: 10:00 AM - 4:00 PM'
            }
          },
          supportInfo: {
            title: '24/7 Support',
            description: "We're here to help with any questions or concerns you might have.",
            responseTime: 'Average response time: 2-4 hours'
          }
        });
        await contact.save();
      }

      res.json({
        success: true,
        contact
      });
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching contact data'
      });
    }
  },

  // Update contact data
  updateContact: async (req, res) => {
    try {
      const { heading, subheading, contactInfo, supportInfo } = req.body;

      let contact = await Contact.findOne();
      
      if (!contact) {
        contact = new Contact();
      }

      contact.heading = heading;
      contact.subheading = subheading;
      contact.contactInfo = contactInfo;
      contact.supportInfo = supportInfo;

      await contact.save();

      res.json({
        success: true,
        message: 'Contact updated successfully',
        contact
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating contact data'
      });
    }
  }
};

export default contactController; 