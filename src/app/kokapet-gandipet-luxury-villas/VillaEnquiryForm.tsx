"use client";

const whatsappLink =
  "https://wa.me/919121000786?text=Hi%2C%20I'm%20interested%20in%20luxury%20villas%20in%20Kokapet%2FGandipet.%20Please%20share%20available%20options.";

export default function VillaEnquiryForm() {
  return (
    <form onSubmit={(e) => { e.preventDefault(); window.open(whatsappLink, "_blank"); }}>
      <div className="form-row">
        <div className="form-field"><label>Full Name</label><input type="text" placeholder="Your name" required /></div>
        <div className="form-field"><label>Mobile Number</label><input type="tel" placeholder="+91 XXXXX XXXXX" required /></div>
      </div>
      <div className="form-row">
        <div className="form-field"><label>Budget Range</label><select><option value="">Select budget</option><option>₹10 – 14 Cr</option><option>₹14 – 18 Cr</option><option>₹18 – 24 Cr</option><option>₹24 Cr and above</option></select></div>
        <div className="form-field"><label>Preferred Location</label><select><option value="">Select location</option><option>Kokapet</option><option>Gandipet</option><option>Narsingi</option><option>Open to any</option></select></div>
      </div>
      <div className="form-field"><label>Requirements</label><textarea rows={3} placeholder="Minimum size, BHK, specific needs..." style={{resize:"vertical"}} /></div>
      <button type="submit" className="form-submit">Request Private Villa Consultation</button>
      <p className="form-note">Your enquiry is completely confidential. Expect a call from our specialist within 2 hours.</p>
    </form>
  );
}
