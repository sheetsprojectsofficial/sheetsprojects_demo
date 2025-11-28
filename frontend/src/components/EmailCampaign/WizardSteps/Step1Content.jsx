import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const Step1Content = ({ campaignData, updateCampaignData, onNext, editingCampaign }) => {
  const { getToken } = useAuth();
  // For editing, show manual entry; for new campaigns, show AI Generate
  const [inputMethod, setInputMethod] = useState(editingCampaign ? 'manual' : 'ai'); // 'manual', 'doc', 'ai'
  const [docUrl, setDocUrl] = useState('');
  const [fetchingDoc, setFetchingDoc] = useState(false);
  const [campaignAbout, setCampaignAbout] = useState('');
  const [campaignName, setCampaignName] = useState(campaignData.campaignName || '');
  const [subject, setSubject] = useState(campaignData.subject || '');
  const [body, setBody] = useState(campaignData.body || '');
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const editorRef = useRef(null);
  const isInternalUpdate = useRef(false);
  const initialLoadDone = useRef(false);

  // Sync local state when campaignData changes (for editing)
  useEffect(() => {
    // Only sync on initial load when editing a campaign
    if (!initialLoadDone.current) {
      if (campaignData.campaignName) {
        setCampaignName(campaignData.campaignName);
      }
      if (campaignData.subject) {
        setSubject(campaignData.subject);
      }
      if (campaignData.body) {
        setBody(campaignData.body);
        // Update editor content after a small delay to ensure it's mounted
        setTimeout(() => {
          if (editorRef.current && campaignData.body) {
            editorRef.current.innerHTML = campaignData.body;
          }
        }, 100);
      }
      // Mark as loaded if we have any data
      if (campaignData.campaignName || campaignData.subject || campaignData.body) {
        initialLoadDone.current = true;
      }
    }
  }, [campaignData.campaignName, campaignData.subject, campaignData.body]);

  useEffect(() => {
    if (editorRef.current && inputMethod === 'manual' && !showPreview && !isInternalUpdate.current) {
      if (body && editorRef.current.innerHTML !== body) {
        editorRef.current.innerHTML = body;
      }
    }
    isInternalUpdate.current = false;
  }, [body, inputMethod, showPreview]);

  const handleEditorChange = () => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      setBody(editorRef.current.innerHTML);
    }
  };

  const handleSaveName = async () => {
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    setSavingName(true);
    try {
      if (editingCampaign) {
        // Update existing campaign name via API
        const token = await getToken();
        await axios.put(
          `${API_BASE_URL}/email-campaigns/${editingCampaign._id}`,
          { name: campaignName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Campaign name updated!');
      } else {
        toast.success('Campaign name saved!');
      }
      updateCampaignData({ campaignName });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch (error) {
      console.error('Error saving campaign name:', error);
      toast.error('Failed to save campaign name');
    } finally {
      setSavingName(false);
    }
  };

  const handleFetchFromDoc = async () => {
    if (!docUrl.trim()) {
      toast.error('Please enter a Google Docs URL');
      return;
    }

    if (!docUrl.includes('docs.google.com')) {
      toast.error('Please enter a valid Google Docs URL');
      return;
    }

    setFetchingDoc(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/email-campaigns/fetch-doc`, {
        docUrl: docUrl
      });

      if (response.data.success) {
        const docContent = response.data.content;
        setBody(docContent);
        toast.success('Document content fetched! Generating subject with AI...');

        try {
          const aiResponse = await axios.post(`${API_BASE_URL}/email-campaigns/generate-subject`, {
            content: docContent
          });

          if (aiResponse.data.success) {
            setSubject(aiResponse.data.subject);
            toast.success('Subject generated successfully!');
          }
        } catch (aiError) {
          console.error('Error generating subject:', aiError);
          toast.info('Could not generate subject. Please enter manually.');
        }

        setInputMethod('manual');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch document. Make sure it is publicly accessible.');
    } finally {
      setFetchingDoc(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!campaignAbout.trim()) {
      toast.error('Please describe what your campaign is about');
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/email-campaigns/generate-content`, {
        description: campaignAbout
      });

      if (response.data.success) {
        setSubject(response.data.subject);
        setBody(response.data.body);
        toast.success('Email content generated successfully!');
        setInputMethod('manual');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error(error.response?.data?.message || 'Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleNext = () => {
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }

    if (!body.trim()) {
      toast.error('Please enter email body content');
      return;
    }

    updateCampaignData({ campaignName, subject, body });
    onNext();
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorChange();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Email Campaign</h2>
      <p className="text-gray-600 mb-6">Choose how you want to create your email content</p>

      {/* Campaign Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Campaign Name <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={campaignName}
            onChange={(e) => {
              setCampaignName(e.target.value);
              setNameSaved(false);
            }}
            placeholder="Enter a name for your campaign"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleSaveName}
            disabled={savingName || !campaignName.trim()}
            className={`px-4 py-3 font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
              nameSaved
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {savingName ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Saving...
              </>
            ) : nameSaved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved!
              </>
            ) : (
              editingCampaign ? 'Update Name' : 'Save Name'
            )}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">This name helps you identify your campaign in the list</p>
      </div>

      {/* Input Method Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setInputMethod('ai')}
              className={`${
                inputMethod === 'ai'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Generate
            </button>
            <button
              onClick={() => setInputMethod('manual')}
              className={`${
                inputMethod === 'manual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Manual Entry
            </button>
            <button
              onClick={() => setInputMethod('doc')}
              className={`${
                inputMethod === 'doc'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Google Doc URL
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area Based on Selected Method */}
      <div className="mt-6">
        {/* Manual Entry */}
        {inputMethod === 'manual' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject line"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Body <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {showPreview ? 'Edit Mode' : 'Preview'}
                </button>
              </div>

              {/* Formatting Toolbar */}
              {!showPreview && (
                <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border border-gray-300 border-b-0 rounded-t-lg">
                  <button type="button" onClick={() => formatText('bold')} className="p-2 hover:bg-gray-200 rounded" title="Bold">
                    <strong>B</strong>
                  </button>
                  <button type="button" onClick={() => formatText('italic')} className="p-2 hover:bg-gray-200 rounded" title="Italic">
                    <em>I</em>
                  </button>
                  <button type="button" onClick={() => formatText('underline')} className="p-2 hover:bg-gray-200 rounded" title="Underline">
                    <u>U</u>
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button type="button" onClick={() => formatText('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded" title="Bullet List">
                    &#8226;
                  </button>
                  <button type="button" onClick={() => formatText('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded" title="Numbered List">
                    1.
                  </button>
                </div>
              )}

              {/* Editor / Preview Area */}
              {showPreview ? (
                <div
                  className="w-full min-h-[300px] p-4 border border-gray-300 rounded-lg bg-white overflow-auto"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              ) : (
                <>
                  <div
                    ref={(el) => {
                      editorRef.current = el;
                      if (el && body && el.innerHTML !== body) {
                        el.innerHTML = body;
                      }
                    }}
                    contentEditable
                    onInput={handleEditorChange}
                    onBlur={handleEditorChange}
                    className="w-full min-h-[300px] p-4 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white overflow-auto"
                    style={{ outline: 'none' }}
                    data-placeholder="Start typing your email content here..."
                    suppressContentEditableWarning={true}
                  />
                  <p className="mt-2 text-sm text-gray-500 text-center">Start Editing - Click above to customize your email content</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Google Doc URL */}
        {inputMethod === 'doc' && (
          <div className="space-y-6">
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">How to use Google Docs:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Open your Google Doc and click "Share"</li>
                <li>Change to "Anyone with the link can view"</li>
                <li>Copy the document URL and paste it below</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Docs URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleFetchFromDoc}
              disabled={fetchingDoc || !docUrl.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {fetchingDoc ? 'Fetching...' : 'Fetch Content'}
            </button>

            {body && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">Content fetched successfully! You can edit it in the Manual Entry tab.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject line"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* AI Generation */}
        {inputMethod === 'ai' && (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI-Powered Content Generation
              </h3>
              <p className="text-sm text-gray-700 mt-2">
                Describe your campaign and AI will generate professional email content for you.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your campaign <span className="text-red-500">*</span>
              </label>
              <textarea
                value={campaignAbout}
                onChange={(e) => setCampaignAbout(e.target.value)}
                placeholder="E.g., Announcing our new product launch with 20% discount for early buyers..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleGenerateWithAI}
              disabled={generating || !campaignAbout.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? 'Generating...' : 'Generate with AI'}
            </button>

            {(subject || body) && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">Content generated successfully! You can edit it in the Manual Entry tab.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-end gap-3 mt-8">
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          Next: Email Configuration
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default Step1Content;
