import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, AlertCircle, Plus, X, ImageIcon } from "lucide-react";
import { post } from "../utils/apiClient";
import { scrollReveal } from "../utils/scrollReveal";

// Additional services customers can add to their quote
const ADDITIONAL_SERVICES = [
  { id: "interior-fridge-freezer", label: "Interior Fridge & Freezer Cleaning" },
  { id: "oven-hob-extractor", label: "Oven, Hob & Extractor Cleaning" },
  { id: "microwave-deep-cleaning", label: "Microwave Deep Cleaning" },
  { id: "washing-machine-cleaning", label: "Washing Machine Cleaning" },
  { id: "interior-window-blind", label: "Interior Window and Blind Cleaning" },
  { id: "deep-tile-grout", label: "Deep Tile & Grout Cleaning" },
  { id: "skirting-board-cleaning", label: "Skirting Board Cleaning" },
  { id: "changing-bedsheet", label: "Changing Bedsheet" },
  { id: "carpet-rug-cleaning", label: "Carpet and Rug Cleaning" },
  { id: "cabinet-cupboard-organization", label: "Inside Cabinet and Cupboard Organization" },
  { id: "sanitizing-high-touch", label: "Sanitizing High-Touch Points (Disinfection)" },
];

// Load reCAPTCHA script
const loadRecaptchaScript = () => {
  if (!window.grecaptcha) {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${import.meta.env.VITE_RECAPTCHA_SITE_KEY}`;
    document.head.appendChild(script);
  }
};

const Quote = () => {
  useEffect(() => {
    loadRecaptchaScript();
  }, []);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [quoteReference, setQuoteReference] = useState("");

  const [formData, setFormData] = useState({
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
    serviceType: "",
    additionalServices: [],
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    postcode: "",
    additionalNotes: "",
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const [errors, setErrors] = useState({});

  // Client-side validation
  const validateStep = (stepNum) => {
    const newErrors = {};

    if (stepNum === 1) {
      if (!formData.propertyType) {
        newErrors.propertyType = "Please select a property type";
      }
      if (
        !formData.bedrooms ||
        formData.bedrooms < 1 ||
        formData.bedrooms > 20
      ) {
        newErrors.bedrooms = "Please enter a valid number of bedrooms (1-20)";
      }
      if (
        !formData.bathrooms ||
        formData.bathrooms < 1 ||
        formData.bathrooms > 20
      ) {
        newErrors.bathrooms = "Please enter a valid number of bathrooms (1-20)";
      }
    }

    if (stepNum === 2) {
      if (!formData.serviceType) {
        newErrors.serviceType = "Please select a service type";
      }
    }

    if (stepNum === 3) {
      if (!formData.firstName || formData.firstName.length < 2) {
        newErrors.firstName = "First name must be at least 2 characters";
      }
      if (!formData.lastName || formData.lastName.length < 2) {
        newErrors.lastName = "Last name must be at least 2 characters";
      }
      if (!formData.email || !isValidEmail(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!formData.phone || !isValidPhone(formData.phone)) {
        newErrors.phone =
          "Please enter a valid UK phone number (e.g., 01234 567890)";
      }
      if (!formData.address || formData.address.length < 5) {
        newErrors.address = "Please enter a valid address";
      }
      if (!formData.postcode || !isValidUKPostcode(formData.postcode)) {
        newErrors.postcode = "Please enter a valid UK postcode (e.g. ME11 2BY)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const isValidPhone = (phone) => {
    const regex = /^(?:\+44|0)(?:\d\s?){9,10}$/;
    const cleaned = phone.replace(/\s/g, "");
    return regex.test(cleaned);
  };

  const isValidUKPostcode = (postcode) => {
    const regex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
    return regex.test(String(postcode).trim());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Remove sanitizing from selection if property type changes to non-commercial/sharehouse
  useEffect(() => {
    if (
      !["commercial", "sharehouse-room"].includes(formData.propertyType) &&
      (formData.additionalServices || []).includes("sanitizing-high-touch")
    ) {
      setFormData((prev) => ({
        ...prev,
        additionalServices: (prev.additionalServices || []).filter((id) => id !== "sanitizing-high-touch"),
      }));
    }
  }, [formData.propertyType]);

  const handleAdditionalServiceToggle = (serviceId) => {
    const current = formData.additionalServices || [];
    const isSelected = current.includes(serviceId);
    const updated = isSelected
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId];
    setFormData({ ...formData, additionalServices: updated });
  };

  const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  const maxSize = 3 * 1024 * 1024;

  const processFiles = (files) => {
    const valid = Array.from(files || []).filter(
      (f) => validImageTypes.includes(f.type) && f.size <= maxSize
    );
    return [...selectedImages, ...valid].slice(0, 5);
  };

  const handleImageChange = (e) => {
    setSelectedImages(processFiles(e.target.files));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files?.length) setSelectedImages(processFiles(files));
  };

  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      let token = "";
      if (window.grecaptcha && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
        token = await window.grecaptcha.execute(
          import.meta.env.VITE_RECAPTCHA_SITE_KEY,
          { action: "submit" },
        );
      }

      const formDataToSend = new FormData();
      formDataToSend.append("propertyType", formData.propertyType);
      formDataToSend.append("bedrooms", formData.bedrooms);
      formDataToSend.append("bathrooms", formData.bathrooms);
      formDataToSend.append("serviceType", formData.serviceType);
      formDataToSend.append("additionalServices", JSON.stringify(formData.additionalServices || []));
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("postcode", String(formData.postcode).trim().toUpperCase());
      formDataToSend.append("additionalNotes", formData.additionalNotes || "");
      formDataToSend.append("captchaToken", token);

      selectedImages.forEach((file) => {
        formDataToSend.append("images", file);
      });

      const data = await post("/api/quotes/submit", formDataToSend);

      if (data.errors) {
        setErrors(data.errors);
        setSubmitError("Please check the form for errors");
        setSubmitting(false);
        return;
      }

      setQuoteReference(data.reference || data.quoteId);
      setSuccessMessage(data.message);
      setStep(4);
    } catch (error) {
      console.error("Submission error:", error);
      const res = error.response?.data;
      if (res?.errors) {
        setErrors(res.errors);
        setSubmitError("Please check the form for errors");
      } else {
        setSubmitError(res?.error || error.message || "A network error occurred. Please try again.");
      }
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
      serviceType: "",
      additionalServices: [],
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      postcode: "",
      additionalNotes: "",
    });
    setSelectedImages([]);
    setErrors({});
    setSubmitError("");
    setSuccessMessage("");
    setQuoteReference("");
  };

  return (
    <motion.section className="pt-32 pb-20 bg-gray-50 min-h-screen" {...scrollReveal}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-8" {...scrollReveal}>
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">
            Get a Quote
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-4">
            Request Your Free Quote
          </h1>
          <p className="text-gray-600">
            Fill out the form below and we'll get back to you with a
            personalized quote
          </p>
        </motion.div>

        {/* Progress Bar - 25%/50%/75% for steps 1-3, 100% on success */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {step < 4 ? `Step ${step} of 3` : "Complete"}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {step < 4 ? Math.round((step / 3) * 75) : 100}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: step < 4 ? `${(step / 3) * 75}%` : "100%",
              }}
            ></div>
          </div>
        </div>

        {step === 4 ? (
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Quote Request Submitted!
            </h2>
            <p className="text-gray-600 mb-2">
              Thank you for your request. We've sent a confirmation to your
              email.
            </p>
            <p className="text-gray-600 mb-6">
              Our team will review your details and get back to you within 24
              hours with a personalized quote.
            </p>

            {quoteReference && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">
                  Your Quote Reference
                </p>
                <p className="font-mono text-lg font-semibold text-gray-900 tracking-wider">
                  {quoteReference}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Save this reference – you'll need it to pay online once your quote is approved.
                </p>
              </div>
            )}

            <button
              onClick={resetForm}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Request Another Quote
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            {/* Error Alert */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">
                    Error submitting form
                  </p>
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              </div>
            )}

            {/* Step 1: Property Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Property Details
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type *
                  </label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                      errors.propertyType
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-200 focus:border-teal-500"
                    }`}
                  >
                    <option value="">Select property type</option>
                    <option value="house">House</option>
                    <option value="flat">Flat/Apartment</option>
                    <option value="bungalow">Bungalow</option>
                    <option value="commercial">Commercial</option>
                    <option value="sharehouse-room">Sharehouse/Room</option>
                  </select>
                  {errors.propertyType && (
                    <p className="text-red-600 text-sm mt-2">
                      {errors.propertyType}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms *
                    </label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      min="1"
                      max="20"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                        errors.bedrooms
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-200 focus:border-teal-500"
                      }`}
                    />
                    {errors.bedrooms && (
                      <p className="text-red-600 text-sm mt-2">
                        {errors.bedrooms}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bathrooms *
                    </label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      min="1"
                      max="20"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                        errors.bathrooms
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-200 focus:border-teal-500"
                      }`}
                    />
                    {errors.bathrooms && (
                      <p className="text-red-600 text-sm mt-2">
                        {errors.bathrooms}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Service Type */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Service Type
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What service do you need? *
                  </label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                      errors.serviceType
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-200 focus:border-teal-500"
                    }`}
                  >
                    <option value="">Select service</option>
                    <option value="residential">
                      Regular Residential Cleaning
                    </option>
                    <option value="end-of-tenancy">
                      End of Tenancy Cleaning
                    </option>
                    <option value="airbnb">Airbnb Turnover Cleaning</option>
                    <option value="commercial">Commercial Cleaning</option>
                  </select>
                  {errors.serviceType && (
                    <p className="text-red-600 text-sm mt-2">
                      {errors.serviceType}
                    </p>
                  )}
                </div>

                {/* Additional Services - Clickable list */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Add-ons (optional)
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Click to add any of these services to your quote:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ADDITIONAL_SERVICES.filter((service) => {
                      if (service.id === "sanitizing-high-touch") {
                        return ["commercial", "sharehouse-room"].includes(formData.propertyType);
                      }
                      return true;
                    }).map((service) => {
                      const isSelected = (formData.additionalServices || []).includes(service.id);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => handleAdditionalServiceToggle(service.id)}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-teal-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-teal-50 hover:border-teal-300 border border-gray-200"
                          }`}
                        >
                          {isSelected ? (
                            <X className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          {service.label}
                        </button>
                      );
                    })}
                  </div>
                  {(formData.additionalServices || []).length > 0 && (
                    <p className="text-xs text-teal-600 mt-2">
                      {(formData.additionalServices || []).length} add-on(s) selected
                    </p>
                  )}
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property photos (optional, max 5)
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Drag and drop or click to upload images for a more accurate quote
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {selectedImages.length < 5 && (
                      <label
                        className={`flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer transition ${
                          isDragging
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-300 hover:border-teal-500 hover:bg-teal-50/50"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <ImageIcon className="w-10 h-10 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">
                          {isDragging ? "Drop here" : "Drop or click"}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                    {selectedImages.map((file, i) => (
                      <div
                        key={i}
                        className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          aria-label="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-0.5 text-center truncate px-1">
                          {file.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG, GIF or WebP. Max 3MB per image.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    placeholder="Tell us anything else that might help us provide an accurate quote..."
                    maxLength="500"
                    rows="4"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.additionalNotes.length}/500 characters
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Contact Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                        errors.firstName
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-200 focus:border-teal-500"
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-red-600 text-sm mt-2">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Smith"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                        errors.lastName
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-200 focus:border-teal-500"
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-red-600 text-sm mt-2">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                      errors.email
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-200 focus:border-teal-500"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-2">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="01234 567890 or +44 1234 567890"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                      errors.phone
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-200 focus:border-teal-500"
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-2">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street, Town or City"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                      errors.address
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-200 focus:border-teal-500"
                    }`}
                  />
                  {errors.address && (
                    <p className="text-red-600 text-sm mt-2">
                      {errors.address}
                    </p>
                  )}
                </div>
                <div className="max-w-[12rem]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postcode *
                  </label>
                  <input
                    type="text"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    placeholder="ME11 2BY"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                      errors.postcode
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-200 focus:border-teal-500"
                    }`}
                  />
                  {errors.postcode && (
                    <p className="text-red-600 text-sm mt-2">
                      {errors.postcode}
                    </p>
                  )}
                </div>

                {/* CAPTCHA Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Protected by reCAPTCHA:</span>{" "}
                    This site is protected by reCAPTCHA and the Google{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a
                      href="https://policies.google.com/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Terms of Service
                    </a>{" "}
                    apply.
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      submitting
                        ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                        : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </motion.section>
  );
};

export default Quote;
