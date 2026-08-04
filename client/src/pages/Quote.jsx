import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, AlertCircle, Plus, X, ImageIcon, Calendar, Clock } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { post } from "../utils/apiClient";
import { scrollReveal } from "../utils/scrollReveal";
import SEO from "../components/SEO";
import { PHONE_MAIN_DISPLAY, PHONE_MAIN_HREF } from "../config/site";
import { getRecaptchaSiteKey, getRecaptchaToken, loadRecaptchaScript } from "../utils/recaptcha";
import {
  getAttributionPayload,
  clearQuoteDraft,
  setServiceInterest,
  setServiceRegionFromPostcode,
} from "../utils/attribution";
import { trackEvent } from "../utils/analytics";
import { loadAndClearQuotePrefill } from "../utils/quotePrefill";
import { createIdempotencyKey, withIdempotency } from "../utils/idempotency";

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

const getFirstErrorMessage = (errorMap = {}) =>
  Object.values(errorMap).filter(Boolean)[0] || "Please check the form for errors";

const TOTAL_STEPS = 2;

const FORM_LABEL = "block text-base font-semibold text-gray-900 mb-2";
const FORM_HINT = "text-base text-gray-700 mb-4 leading-relaxed";
const FORM_SECTION_TITLE = "text-2xl sm:text-3xl font-bold text-gray-900 mb-2";
const FORM_ERROR = "text-red-700 text-base font-medium mt-2";
const INPUT_BASE =
  "w-full px-4 py-3.5 text-base text-gray-900 border-2 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/40";
const BTN_PRIMARY =
  "bg-teal-600 hover:bg-teal-700 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition min-h-[48px]";
const BTN_SECONDARY =
  "bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3.5 rounded-xl font-semibold text-base transition min-h-[48px]";

const fieldClass = (errors, name) =>
  `${INPUT_BASE} ${errors[name] ? "border-red-500 focus:border-red-600" : "border-gray-300 focus:border-teal-600"}`;

const EMPTY_FORM = {
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
  preferredDate: "",
  preferredTime: "",
  additionalNotes: "",
};

const Quote = () => {
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [quoteReference, setQuoteReference] = useState("");

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageUploadWarning, setImageUploadWarning] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [errors, setErrors] = useState({});
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey());

  useEffect(() => {
    loadRecaptchaScript("quote-form");
  }, []);

  // Fresh start every time the quote page is opened (no saved draft / step restore).
  useEffect(() => {
    clearQuoteDraft();
    setStep(1);
    setSelectedImages([]);
    setImageUploadWarning("");
    setErrors({});
    setSubmitError("");
    setSuccessMessage("");
    setQuoteReference("");

    const prefill = loadAndClearQuotePrefill();
    if (prefill) {
      setFormData({
        ...EMPTY_FORM,
        ...(prefill.firstName && { firstName: prefill.firstName }),
        ...(prefill.lastName && { lastName: prefill.lastName }),
        ...(prefill.email && { email: prefill.email }),
        ...(prefill.phone && { phone: prefill.phone }),
        ...(prefill.address && { address: prefill.address }),
        ...(prefill.postcode && { postcode: prefill.postcode }),
        ...(prefill.serviceType && { serviceType: prefill.serviceType }),
        ...(prefill.propertyType && { propertyType: prefill.propertyType }),
        ...(prefill.bedrooms && { bedrooms: String(prefill.bedrooms) }),
        ...(prefill.bathrooms && { bathrooms: String(prefill.bathrooms) }),
      });
    } else {
      setFormData(EMPTY_FORM);
    }

    return () => clearQuoteDraft();
  }, [location.key]);

  useEffect(() => {
    if (formData.serviceType) setServiceInterest(formData.serviceType);
  }, [formData.serviceType]);

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
      if (!formData.serviceType) {
        newErrors.serviceType = "Please select a service type";
      }
    }

    if (stepNum === 2) {
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
      } else {
        setServiceRegionFromPostcode(formData.postcode);
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
    if (errors.additionalServices) {
      setErrors({ ...errors, additionalServices: "" });
    }
  };

  const validImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic",
    "image/heif",
  ];
  const validImageExtension = /\.(jpe?g|png|gif|webp|heic|heif)$/i;
  const maxSize = 3 * 1024 * 1024;

  const isAcceptedImage = (file) => {
    if (!file || file.size > maxSize) return false;
    if (validImageTypes.includes(file.type)) return true;
    const name = file.name || "";
    if (validImageExtension.test(name)) {
      return !file.type || file.type.startsWith("image/");
    }
    return false;
  };

  const processFiles = (files) => {
    const incoming = Array.from(files || []);
    const accepted = [];
    let skipped = 0;

    incoming.forEach((file) => {
      if (isAcceptedImage(file)) {
        accepted.push(file);
      } else {
        skipped += 1;
      }
    });

    if (skipped > 0) {
      setImageUploadWarning(
        `${skipped} file${skipped === 1 ? "" : "s"} skipped. Use JPG, PNG, GIF, WebP, or HEIC under 3MB each.`,
      );
    } else {
      setImageUploadWarning("");
    }

    return [...selectedImages, ...accepted].slice(0, 5);
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

    if (!validateStep(2)) {
      setSubmitError("Please check the highlighted fields");
      return;
    }

    setSubmitting(true);

    try {
      let token = "";
      const recaptchaSiteKey = getRecaptchaSiteKey();
      if (!recaptchaSiteKey && import.meta.env.PROD) {
        setSubmitError(
          "Security check is not configured on this site. Please contact support (missing VITE_RECAPTCHA_SITE_KEY).",
        );
        setSubmitting(false);
        return;
      }
      if (recaptchaSiteKey) {
        try {
          token = await getRecaptchaToken("quote_submit");
        } catch (captchaErr) {
          console.error("reCAPTCHA execute failed:", captchaErr);
          setSubmitError(
            captchaErr?.message ||
              "Could not verify the form (reCAPTCHA). Refresh the page and try again, or check that this site domain is allowed in your Google reCAPTCHA settings.",
          );
          setSubmitting(false);
          return;
        }
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
      formDataToSend.append("preferredDate", formData.preferredDate || "");
      formDataToSend.append("preferredTime", formData.preferredTime || "");
      formDataToSend.append("additionalNotes", formData.additionalNotes || "");
      formDataToSend.append("captchaToken", token);

      selectedImages.forEach((file) => {
        formDataToSend.append("images", file);
      });

      const attribution = getAttributionPayload();
      if (formData.postcode) {
        attribution.serviceRegion =
          setServiceRegionFromPostcode(formData.postcode) || attribution.serviceRegion;
      }
      if (formData.serviceType) {
        attribution.serviceInterest = formData.serviceType;
      }
      formDataToSend.append("attribution", JSON.stringify(attribution));

      const data = await post(
        "/api/quotes/submit",
        formDataToSend,
        withIdempotency(idempotencyKey),
      );

      if (data.errors) {
        setErrors(data.errors);
        setSubmitError(getFirstErrorMessage(data.errors));
        setSubmitting(false);
        return;
      }

      setQuoteReference(data.reference || data.quoteId);
      setSuccessMessage(data.message);
      clearQuoteDraft();
      trackEvent("quote_submit", {
        service_type: formData.serviceType,
        region: attribution.serviceRegion || "unknown",
        has_photos: selectedImages.length > 0,
      });
      setStep(4);
      setIdempotencyKey(createIdempotencyKey());
      setSubmitting(false);
    } catch (error) {
      console.error("Submission error:", error);
      const res = error.response?.data;
      if (res?.errors) {
        setErrors(res.errors);
        setSubmitError(getFirstErrorMessage(res.errors));
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
    setFormData(EMPTY_FORM);
    setSelectedImages([]);
    setImageUploadWarning("");
    setErrors({});
    setSubmitError("");
    setSuccessMessage("");
    setQuoteReference("");
  };

  return (
    <>
      <SEO
        title="Request a Cleaning Quote"
        description="Request a free no-obligation cleaning quote for residential, end of tenancy, Airbnb, or commercial services."
        path="/request-a-quote"
      />
      <motion.section className="pt-32 pb-20 bg-gray-50 min-h-screen" {...scrollReveal}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-8" {...scrollReveal}>
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">
            Get a Quote
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-4">
            Request Your Free Quote
          </h1>
          <p className="text-gray-600">
            Fill in a few quick details and our team will send a personalised quote within 24 hours.
          </p>
        </motion.div>

        {/* Progress Bar — 50% step 1, 100% step 2, complete on success */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {step < 4 ? `Step ${step} of ${TOTAL_STEPS}` : "Complete"}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {step < 4 ? Math.round((step / TOTAL_STEPS) * 100) : 100}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: step < 4 ? `${(step / TOTAL_STEPS) * 100}%` : "100%",
              }}
            ></div>
          </div>
        </div>
        {step < 4 && (
          <div className="mb-8 bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
            <p>
              Need help now? Call{" "}
              <a href={PHONE_MAIN_HREF} className="text-teal-700 font-semibold hover:text-teal-800">
                {PHONE_MAIN_DISPLAY}
              </a>{" "}
              and we can guide you through your quote in minutes.
            </p>
          </div>
        )}

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
            <div className="mt-4">
              <Link to="/services" className="text-teal-700 hover:text-teal-800 font-medium">
                View all cleaning services
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 sm:p-10 shadow-lg border border-gray-100"
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

            {/* Step 1: Property & service */}
            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className={FORM_SECTION_TITLE}>Property details</h2>
                  <p className={FORM_HINT}>This helps us estimate time and team size accurately.</p>
                </div>
                <div>
                  <label htmlFor="propertyType" className={FORM_LABEL}>Property type *</label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    className={fieldClass(errors, "propertyType")}
                  >
                    <option value="">Select property type</option>
                    <option value="house">House</option>
                    <option value="flat">Flat/Apartment</option>
                    <option value="bungalow">Bungalow</option>
                    <option value="commercial">Commercial</option>
                    <option value="sharehouse-room">Sharehouse/Room</option>
                  </select>
                  {errors.propertyType && <p className={FORM_ERROR}>{errors.propertyType}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="bedrooms" className={FORM_LABEL}>Bedrooms *</label>
                    <input
                      id="bedrooms"
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      min="1"
                      max="20"
                      inputMode="numeric"
                      className={fieldClass(errors, "bedrooms")}
                    />
                    {errors.bedrooms && <p className={FORM_ERROR}>{errors.bedrooms}</p>}
                  </div>
                  <div>
                    <label htmlFor="bathrooms" className={FORM_LABEL}>Bathrooms *</label>
                    <input
                      id="bathrooms"
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      min="1"
                      max="20"
                      inputMode="numeric"
                      className={fieldClass(errors, "bathrooms")}
                    />
                    {errors.bathrooms && <p className={FORM_ERROR}>{errors.bathrooms}</p>}
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <h2 className={FORM_SECTION_TITLE}>Service & add-ons</h2>
                  <p className={FORM_HINT}>Choose your service and add photos or extras for a more accurate quote.</p>
                </div>
                <div>
                  <label htmlFor="serviceType" className={FORM_LABEL}>What service do you need? *</label>
                  <select
                    id="serviceType"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    className={fieldClass(errors, "serviceType")}
                  >
                    <option value="">Select service</option>
                    <option value="residential">Regular Residential Cleaning</option>
                    <option value="end-of-tenancy">End of Tenancy Cleaning</option>
                    <option value="airbnb">Airbnb Turnover Cleaning</option>
                    <option value="commercial">Commercial Cleaning</option>
                  </select>
                  {errors.serviceType && <p className={FORM_ERROR}>{errors.serviceType}</p>}
                </div>

                <div>
                  <label className={FORM_LABEL}>Add-ons (optional)</label>
                  <p className="text-base text-gray-600 mb-3">Tap to add any extra services to your quote:</p>
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
                          className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium transition-all min-h-[48px] ${
                            isSelected
                              ? "bg-teal-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-800 hover:bg-teal-50 border-2 border-gray-200"
                          }`}
                        >
                          {isSelected ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          {service.label}
                        </button>
                      );
                    })}
                  </div>
                  {(formData.additionalServices || []).length > 0 && (
                    <p className="text-base text-teal-700 font-medium mt-2">
                      {(formData.additionalServices || []).length} add-on(s) selected
                    </p>
                  )}
                </div>

                <div>
                  <label className={FORM_LABEL}>Property photos (optional, max 5)</label>
                  <p className="text-base text-gray-600 mb-3">Drag and drop or tap to upload photos</p>
                  <div className="flex flex-wrap gap-3">
                    {selectedImages.length < 5 && (
                      <label
                        className={`flex flex-col items-center justify-center w-36 h-36 border-2 border-dashed rounded-xl cursor-pointer transition ${
                          isDragging
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-300 hover:border-teal-500 hover:bg-teal-50/50"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <ImageIcon className="w-10 h-10 text-gray-500" />
                        <span className="text-sm text-gray-600 mt-2 text-center px-2">
                          {isDragging ? "Drop here" : "Drop or tap to upload"}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                    {selectedImages.map((file, i) => (
                      <div
                        key={i}
                        className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-gray-200 group"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {imageUploadWarning && (
                    <p className="text-base text-amber-800 font-medium mt-2">{imageUploadWarning}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="additionalNotes" className={FORM_LABEL}>Additional notes (optional)</label>
                  <textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    placeholder="Anything else that helps us quote accurately..."
                    maxLength="500"
                    rows="4"
                    className={`${INPUT_BASE} border-gray-300 focus:border-teal-600 min-h-[120px]`}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button type="button" onClick={nextStep} className={BTN_PRIMARY}>
                    Click next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Contact information */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className={FORM_SECTION_TITLE}>Your contact details</h2>
                  <p className={FORM_HINT}>
                    Final step. We use these details only to send your quote and booking options.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="firstName" className={FORM_LABEL}>First name *</label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      autoComplete="given-name"
                      className={fieldClass(errors, "firstName")}
                    />
                    {errors.firstName && <p className={FORM_ERROR}>{errors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className={FORM_LABEL}>Last name *</label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Smith"
                      autoComplete="family-name"
                      className={fieldClass(errors, "lastName")}
                    />
                    {errors.lastName && <p className={FORM_ERROR}>{errors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className={FORM_LABEL}>Email address *</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    autoComplete="email"
                    className={fieldClass(errors, "email")}
                  />
                  {errors.email && <p className={FORM_ERROR}>{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className={FORM_LABEL}>Phone number *</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="01234 567890 or +44 1234 567890"
                    autoComplete="tel"
                    className={fieldClass(errors, "phone")}
                  />
                  {errors.phone && <p className={FORM_ERROR}>{errors.phone}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="preferredDate" className={FORM_LABEL}>Preferred date</label>
                    <div className="relative">
                      <input
                        id="preferredDate"
                        type="date"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleInputChange}
                        className={`${INPUT_BASE} border-gray-300 focus:border-teal-600 pr-12`}
                      />
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="preferredTime" className={FORM_LABEL}>Preferred time</label>
                    <div className="relative">
                      <input
                        id="preferredTime"
                        type="time"
                        name="preferredTime"
                        value={formData.preferredTime}
                        onChange={handleInputChange}
                        className={`${INPUT_BASE} border-gray-300 focus:border-teal-600 pr-12`}
                      />
                      <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className={FORM_LABEL}>Property address *</label>
                  <input
                    id="address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street, Town or City"
                    autoComplete="street-address"
                    className={fieldClass(errors, "address")}
                  />
                  {errors.address && <p className={FORM_ERROR}>{errors.address}</p>}
                </div>
                <div className="max-w-xs">
                  <label htmlFor="postcode" className={FORM_LABEL}>Postcode *</label>
                  <input
                    id="postcode"
                    type="text"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    placeholder="ME11 2BY"
                    autoComplete="postal-code"
                    className={fieldClass(errors, "postcode")}
                  />
                  {errors.postcode && <p className={FORM_ERROR}>{errors.postcode}</p>}
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  {getRecaptchaSiteKey() ? (
                    <p className="text-base text-blue-900">
                      <span className="font-semibold">Protected by reCAPTCHA:</span>{" "}
                      This site is protected by reCAPTCHA and the Google{" "}
                      <a
                        href="https://policies.google.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium"
                      >
                        Privacy Policy
                      </a>{" "}
                      and{" "}
                      <a
                        href="https://policies.google.com/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium"
                      >
                        Terms of Service
                      </a>{" "}
                      apply.
                    </p>
                  ) : (
                    <p className="text-base text-blue-900">
                      CAPTCHA is currently unavailable in this environment.
                    </p>
                  )}
                  {errors.captchaToken && <p className={FORM_ERROR}>{errors.captchaToken}</p>}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
                  <button type="button" onClick={prevStep} className={BTN_SECONDARY}>
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`${BTN_PRIMARY} disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto`}
                  >
                    {submitting ? "Submitting..." : "Submit quote request"}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
        </div>
      </motion.section>
    </>
  );
};

export default Quote;
