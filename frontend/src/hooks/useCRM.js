import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004';

export const useCRM = () => {
  const [crmEntries, setCrmEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [saving, setSaving] = useState(false);
  const { getToken } = useAuth();

  useEffect(() => {
    fetchCRMEntries();
  }, []);

  const fetchCRMEntries = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const response = await axios.get(`${API_BASE_URL}/email-campaigns/crm-entries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setCrmEntries(response.data.data);
      } else {
        toast.error('Failed to fetch CRM entries');
      }
    } catch (error) {
      console.error('Error fetching CRM entries:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch CRM entries');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry._id);
    setEditedData({
      companyName: entry.companyName,
      contactPerson: entry.contactPerson,
      designation: entry.designation,
      mobileNumber: entry.mobileNumber,
      landline: entry.landline,
      email: entry.email,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedData({});
  };

  const handleFieldChange = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (id) => {
    try {
      setSaving(true);
      const token = await getToken();

      const response = await axios.put(
        `${API_BASE_URL}/email-campaigns/crm-entries/${id}`,
        editedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success('Contact updated successfully');
        setCrmEntries(
          crmEntries.map((entry) =>
            entry._id === id ? { ...entry, ...editedData } : entry
          )
        );
        setEditingId(null);
        setEditedData({});
      } else {
        toast.error('Failed to update contact');
      }
    } catch (error) {
      console.error('Error updating CRM entry:', error);
      toast.error(error.response?.data?.message || 'Failed to update contact');
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (entryId) => {
    const token = await getToken();
    const response = await axios.delete(
      `${API_BASE_URL}/email-campaigns/crm-entries/${entryId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      toast.success('Contact deleted successfully');
      setCrmEntries(crmEntries.filter((entry) => entry._id !== entryId));
      return true;
    } else {
      toast.error('Failed to delete contact');
      return false;
    }
  };

  const createContact = async (contactData) => {
    const token = await getToken();
    const response = await axios.post(
      `${API_BASE_URL}/email-campaigns/crm-entries`,
      {
        companyName: contactData.companyName.trim() || 'N/A',
        contactPerson: contactData.contactPerson.trim() || 'N/A',
        designation: contactData.designation.trim() || 'N/A',
        mobileNumber: contactData.mobileNumber.trim() || 'N/A',
        landline: contactData.landline.trim() || 'N/A',
        email: contactData.email.trim().toLowerCase(),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      toast.success('Contact added successfully');
      setCrmEntries([response.data.data, ...crmEntries]);
      return { success: true };
    } else {
      toast.error('Failed to add contact');
      return { success: false };
    }
  };

  return {
    crmEntries,
    loading,
    editingId,
    editedData,
    saving,
    handleEdit,
    handleCancelEdit,
    handleFieldChange,
    handleSave,
    deleteContact,
    createContact,
  };
};
