import Navigation from '../models/Navigation.js';

// Get navigation items
export const getNavigation = async (req, res) => {
  try {
    let navigation = await Navigation.findOne();
    
    if (!navigation) {
      // Create default navigation if none exists
      const defaultItems = [
        { id: 1, name: 'Home', href: '/', visible: true, active: true, order: 1 },
        { id: 2, name: 'Products', href: '/products', visible: true, active: false, order: 2 },
        { id: 3, name: 'Blog', href: '/blog', visible: true, active: false, order: 3 },
        { id: 4, name: 'Showcase', href: '/showcase', visible: true, active: false, order: 4 },
        { id: 5, name: 'Webinar', href: '/webinar', visible: false, active: false, order: 5 },
        { id: 6, name: 'Book', href: '/book', visible: true, active: false, order: 6 },
        { id: 7, name: 'Events', href: '/events', visible: false, active: false, order: 7 },
        { id: 8, name: 'Courses', href: '/courses', visible: true, active: false, order: 8 },
        { id: 9, name: 'Trainings', href: '/trainings', visible: false, active: false, order: 9 },
      ];
      
      navigation = new Navigation({ items: defaultItems });
      await navigation.save();
    }

    res.json({
      success: true,
      navigation: navigation.items
    });
  } catch (error) {
    console.error('Get navigation error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update navigation items
export const updateNavigation = async (req, res) => {
  try {
    const { items } = req.body;

    let navigation = await Navigation.findOne();
    
    if (!navigation) {
      navigation = new Navigation();
    }

    navigation.items = items;
    navigation.updatedAt = new Date();
    await navigation.save();

    res.json({
      success: true,
      message: 'Navigation updated successfully',
      navigation: navigation.items
    });
  } catch (error) {
    console.error('Update navigation error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Toggle navigation item visibility
export const toggleNavigationItem = async (req, res) => {
  try {
    const { id } = req.params;

    let navigation = await Navigation.findOne();
    
    if (!navigation) {
      return res.status(404).json({ success: false, message: 'Navigation not found' });
    }

    const item = navigation.items.find(item => item.id === parseInt(id));
    if (!item) {
      return res.status(404).json({ success: false, message: 'Navigation item not found' });
    }

    item.visible = !item.visible;
    navigation.updatedAt = new Date();
    await navigation.save();

    res.json({
      success: true,
      message: 'Navigation item toggled successfully',
      navigation: navigation.items
    });
  } catch (error) {
    console.error('Toggle navigation item error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}; 