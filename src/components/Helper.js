const getExactAddress = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
    );

    const data = await response.json();

    if (data?.address) {
      return {
        fullAddress: data.display_name || "",
        city: data.address.city || data.address.town || data.address.village || "",
        state: data.address.state || "",
        country: data.address.country || "",
        postcode: data.address.postcode || "",
        road: data.address.road || "",
        suburb: data.address.suburb || "",
      };
    }

    return null;
  } catch (err) {
    console.error("Reverse Geocoding Error:", err);
    return null;
  }
};
export { getExactAddress };