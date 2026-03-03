import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Calendar, 
  MapPin, 
  Image, 
  Ticket, 
  User,
  Upload
} from 'lucide-react';
import { useAuth, useLanguage } from '../context';
import { api } from '../utils/api';
import { toast } from 'sonner';

const steps = [
  { id: 'basic', label: 'Basic Info', icon: Calendar },
  { id: 'datetime', label: 'Date & Time', icon: Calendar },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'tickets', label: 'Tickets', icon: Ticket },
  { id: 'contact', label: 'Contact', icon: User },
];

export default function CreateEvent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    tags: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    locationType: 'physical',
    venueName: '',
    address: '',
    onlineLink: '',
    coverImage: '',
    isFree: true,
    price: '',
    currency: 'USD',
    maxCapacity: '',
    organizerName: '',
    organizerPhone: '',
    organizerEmail: '',
  });

  const { user, canPostEvent } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Redirect if phone not verified
  if (!canPostEvent()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-3xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Phone Verification Required
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            To create events, you need to verify your phone number first.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
          >
            Verify Phone Number
          </button>
        </motion.div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const eventData = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        price: formData.isFree ? null : { amount: parseFloat(formData.price), currency: formData.currency },
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : null,
      };

      console.log("Submitting event with data:", eventData);

      const response = await api.createEvent(eventData);
      toast.success('Event created successfully! It will be reviewed shortly.');
      navigate(`/events/${response.data.event.slug}`);
    } catch (error) {
      toast.error(error.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                placeholder="Enter event title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Short Description
              </label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => updateField('shortDescription', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                placeholder="Brief description (max 300 characters)"
                maxLength={300}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Full Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 resize-none"
                placeholder="Describe your event in detail"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select a category</option>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="concert">Concert</option>
                <option value="sports">Sports</option>
                <option value="social">Social</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                placeholder="music, festival, outdoor"
              />
            </div>
          </div>
        );

      case 1: // Date & Time
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => updateField('startTime', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => updateField('endTime', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Location
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Event Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['physical', 'online', 'hybrid'].map((type) => (
                  <button
                    key={type}
                    onClick={() => updateField('locationType', type)}
                    className={`p-4 rounded-xl border-2 transition-all capitalize ${
                      formData.locationType === type
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {(formData.locationType === 'physical' || formData.locationType === 'hybrid') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Venue Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.venueName}
                    onChange={(e) => updateField('venueName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                    placeholder="Enter venue name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 resize-none"
                    placeholder="Enter full address"
                  />
                </div>
              </>
            )}

            {(formData.locationType === 'online' || formData.locationType === 'hybrid') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Online Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.onlineLink}
                  onChange={(e) => updateField('onlineLink', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            )}
          </div>
        );

      case 3: // Media
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Cover Image URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => updateField('coverImage', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            {formData.coverImage && (
              <div className="rounded-xl overflow-hidden">
                <img 
                  src={formData.coverImage} 
                  alt="Preview" 
                  className="w-full h-48 object-cover"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>
        );

      case 4: // Tickets
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="isFree"
                checked={formData.isFree}
                onChange={(e) => updateField('isFree', e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
              />
              <label htmlFor="isFree" className="text-slate-700 dark:text-slate-300">
                This is a free event
              </label>
            </div>

            {!formData.isFree && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => updateField('currency', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="ETB">ETB</option>
                    <option value="KRW">KRW</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Maximum Capacity
              </label>
              <input
                type="number"
                value={formData.maxCapacity}
                onChange={(e) => updateField('maxCapacity', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>
          </div>
        );

      case 5: // Contact
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Organizer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.organizerName}
                onChange={(e) => updateField('organizerName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                placeholder="Your name or organization"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Organizer Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.organizerPhone}
                onChange={(e) => updateField('organizerPhone', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                placeholder="+1 234 567 890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Organizer Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.organizerEmail}
                onChange={(e) => updateField('organizerEmail', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                placeholder="contact@example.com"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Create Your Event
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Fill in the details below to create your amazing event
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                    index <= currentStep
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-full h-1 mx-2 transition-colors ${
                      index < currentStep
                        ? 'bg-sky-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <span
                key={step.id}
                className={`text-xs font-medium ${
                  index <= currentStep
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>

        {/* Form Card with Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                {steps[currentStep].label}
              </h2>
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Create Event
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
